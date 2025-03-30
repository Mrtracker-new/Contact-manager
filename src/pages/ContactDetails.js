import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { createVCardFile, createVCardFileForSharing } from '../utils/vCardFormatter';
import { generateQRCode } from '../utils/contactImportExport';
import { 
  Container, Typography, Box, Paper, Avatar, IconButton, Dialog,
  DialogContent, DialogTitle, Snackbar, Alert, CircularProgress,
  Button, List, ListItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Call as CallIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  TextSnippet as TextSnippetIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  WhatsApp as WhatsAppIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { ContactsContext } from '../App';
import { getContactById, deleteContact, updateContact } from '../utils/contactsStorage';
import { createSafeObjectURL, revokeSafeObjectURL, base64ToBlob, dataURItoBlob } from '../utils/documentHandler';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentListItem = ({ 
  doc, 
  onView, 
  onShare, 
  onDownload, 
  onDelete 
}) => (
  <ListItem
    secondaryAction={
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton onClick={onView} size="small">
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={onShare} size="small">
          <ShareIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={onDownload} size="small">
          <FileDownloadIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={onDelete} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    }
    sx={{ 
      transition: 'background-color 0.2s', 
      '&:hover': { bgcolor: 'action.hover' },
      py: 1.5
    }}
  >
    <ListItemIcon sx={{ minWidth: 40 }}>
      {doc.file?.type?.startsWith('image/') ? <ImageIcon color="primary" /> :
       doc.file?.type === 'application/pdf' ? <PictureAsPdfIcon color="primary" /> :
       <InsertDriveFileIcon color="primary" />}
    </ListItemIcon>
    <ListItemText
      primary={doc.name || 'Unnamed Document'}
      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
      secondary={doc.file ? formatFileSize(doc.file.size) : 'Size unavailable'}
    />
  </ListItem>
);

const ContactDetails = () => {
  const [contact, setContact] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshContacts } = useContext(ContactsContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState([]);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const handleShowMessage = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const loadContact = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedContact = await getContactById(id);
      if (!loadedContact) {
        handleShowMessage('Contact not found', 'error');
        navigate('/', { replace: true });
        return;
      }

      // Process documents
      const processedContact = {
        ...loadedContact,
        documents: (loadedContact.documents || []).map(doc => {
          try {
            if (!doc || !doc.data) return null;

            return {
              ...doc,
              id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: doc.name || 'Unnamed Document',
              file: doc.data.startsWith('data:') ? dataURItoBlob(doc.data) : base64ToBlob(doc.data),
              type: doc.type || 'application/octet-stream'
            };
          } catch (error) {
            console.error('Error processing document:', error);
            return null;
          }
        }).filter(Boolean)
      };

      setContact(processedContact);
    } catch (err) {
      console.error('Contact load error:', err);
      setError('Failed to load contact details');
      handleShowMessage('Failed to load contact', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, handleShowMessage]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleDocumentAction = async (doc, action) => {
    try {
      if (!doc.file || !(doc.file instanceof Blob)) {
        throw new Error('Invalid file data');
      }

      if (Capacitor.isNativePlatform()) {
        const { Filesystem } = Capacitor.Plugins;
        const fileName = `${doc.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
        const path = `contacts_documents/${fileName}`;
        
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(doc.file);
        });

        await Filesystem.writeFile({
          path,
          data: base64Data,
          directory: 'DOCUMENTS',
          recursive: true
        });

        const uri = await Filesystem.getUri({ directory: 'DOCUMENTS', path });

        if (action === 'share') {
          await Share.share({ title: doc.name, url: uri.uri });
        } else {
          await Toast.show({ 
            text: `File saved to Documents/${path}`,
            duration: 'long'
          });
        }
      } else {
        const url = URL.createObjectURL(doc.file);
        const link = document.createElement('a');
        link.href = url;
        
        if (action === 'download') {
          link.download = doc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          handleShowMessage(`${doc.name} downloaded successfully`, 'success');
        } else if (action === 'share' && navigator.share) {
          await navigator.share({
            title: doc.name,
            files: [new File([doc.file], doc.name, { type: doc.file.type })]
          });
        }

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      handleShowMessage(error.message || 'Document operation failed', 'error');
      console.error('Document action error:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
      refreshContacts();
      navigate('/');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      const updatedDocuments = contact.documents.filter(doc => doc.id !== docId);
      const storageDocuments = await Promise.all(updatedDocuments.map(async doc => ({
        ...doc,
        fileData: await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(doc.file);
        })
      })));

      const updatedContact = { ...contact, documents: storageDocuments };
      await updateContact(updatedContact);
      setContact({ ...updatedContact, documents: updatedDocuments });
      handleShowMessage('Document deleted successfully', 'success');
    } catch (error) {
      handleShowMessage('Failed to delete document', 'error');
      console.error('Document deletion error:', error);
    }
  };

  const renderDocumentPreview = () => {
    if (!previewDoc?.file) return null;
    const objectUrl = createSafeObjectURL(previewDoc.file);

    return (
      <Box sx={{ position: 'relative', height: '80vh' }}>
        {previewDoc.file.type.startsWith('image/') ? (
          <img
            src={objectUrl}
            alt={previewDoc.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              backgroundColor: '#f0f0f0'
            }}
            onLoad={() => revokeSafeObjectURL(objectUrl)}
          />
        ) : previewDoc.file.type === 'application/pdf' ? (
          <iframe
            title={previewDoc.name}
            src={objectUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Preview not available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              File type not supported for preview
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const handleShareContact = async () => {
    try {
      setShareDialogOpen(true);
      const options = [
        { label: 'Share vCard', icon: <ShareIcon />, action: 'vcard' },
        { label: 'Share QR Code', icon: <QrCodeIcon />, action: 'qrcode' }
      ];
      setShareOptions(options);
    } catch (error) {
      handleShowMessage('Failed to share contact', 'error');
      console.error('Share error:', error);
    }
  };

  const handleShareOptionSelect = async (option) => {
    try {
      setShareDialogOpen(false);
      
      if (option.action === 'vcard') {
        const vCardFile = createVCardFileForSharing(contact);
        
        if (Capacitor.isNativePlatform()) {
          // For native platforms (Android/iOS), use Capacitor Share
          const { Filesystem } = Capacitor.Plugins;
          const fileName = `${contact.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.vcf`;
          const path = `contacts/${fileName}`;
          
          // Convert the vCard file to base64
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(vCardFile);
          });

          // Save the file temporarily
          await Filesystem.writeFile({
            path,
            data: base64Data,
            directory: 'DOCUMENTS',
            recursive: true
          });

          // Get the file URI
          const { uri } = await Filesystem.getUri({ 
            directory: 'DOCUMENTS', 
            path 
          });

          // Share the file
          await Share.share({
            title: `${contact.name}'s Contact`,
            text: `Share ${contact.name}'s contact information`,
            url: uri.uri,
            dialogTitle: 'Share Contact Via'
          });

          // Clean up the temporary file
          try {
            await Filesystem.deleteFile({
              path,
              directory: 'DOCUMENTS'
            });
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError);
          }
        } else {
          // For web platforms, try Web Share API first
          if (navigator.share) {
            try {
              await navigator.share({
                title: `${contact.name}'s Contact`,
                text: `Share ${contact.name}'s contact information`,
                files: [vCardFile]
              });
            } catch (shareError) {
              // If Web Share API fails, fall back to download
              const vCardUrl = URL.createObjectURL(vCardFile);
              const link = document.createElement('a');
              link.href = vCardUrl;
              link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(vCardUrl), 1000);
              handleShowMessage('Contact saved as vCard file', 'success');
            }
          } else {
            // If Web Share API is not available, use download
            const vCardUrl = URL.createObjectURL(vCardFile);
            const link = document.createElement('a');
            link.href = vCardUrl;
            link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(vCardUrl), 1000);
            handleShowMessage('Contact saved as vCard file', 'success');
          }
        }
      } else if (option.action === 'qrcode') {
        const qrCode = await generateQRCode(contact);
        setQrCodeUrl(qrCode);
        setQrCodeDialogOpen(true);
      }
    } catch (error) {
      console.error('Share option error:', error);
      handleShowMessage('Failed to share contact. The contact will be downloaded instead.', 'warning');
      
      // Fallback to download if sharing fails
      const vCardFile = createVCardFileForSharing(contact);
      const vCardUrl = URL.createObjectURL(vCardFile);
      const link = document.createElement('a');
      link.href = vCardUrl;
      link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(vCardUrl), 1000);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !contact) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Contact not found'}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/')}>
          Back to Contacts
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            gap: 2
          }}>
            <IconButton 
              component={Link} 
              to="/" 
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Contact Details
            </Typography>
          </Box>

          <Box sx={{ 
            bgcolor: 'background.paper', 
            p: 4,
            borderRadius: 3,
            boxShadow: 2,
            position: 'relative',
            textAlign: 'center',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}>
            <Avatar
              src={contact.photo instanceof Blob ? URL.createObjectURL(contact.photo) : undefined}
              sx={{
                width: 120,
                height: 120,
                mb: 3,
                mx: 'auto',
                border: '4px solid',
                borderColor: 'primary.main',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              {contact.name.charAt(0)}
            </Avatar>

            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}>
              {contact.name}
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 2, 
              mb: 3,
              flexWrap: 'wrap'
            }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/edit-contact/${id}`)}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                sx={{
                  '&:hover': {
                    bgcolor: 'error.dark'
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShareContact}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.light',
                    color: 'primary.dark'
                  }
                }}
              >
                Share
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3,
              textAlign: 'left'
            }}>
              {[
                { icon: <CallIcon />, value: contact.phone, type: 'phone' },
                { icon: <EmailIcon />, value: contact.email, type: 'email' },
                { icon: <LocationIcon />, value: contact.address, type: 'address' }
              ].map((item, index) => item.value && (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box sx={{ 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    opacity: 0.9
                  }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.type.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {contact.documents?.length > 0 && (
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              boxShadow: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 600, 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <InsertDriveFileIcon color="primary" />
              Attachments ({contact.documents.length})
            </Typography>
            <List>
              {contact.documents.map((doc) => (
                <DocumentListItem
                  key={doc.id}
                  doc={doc}
                  onView={() => {
                    setPreviewDoc(doc);
                    setPreviewOpen(true);
                  }}
                  onShare={() => handleDocumentAction(doc, 'share')}
                  onDownload={() => handleDocumentAction(doc, 'download')}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
              ))}
            </List>
          </Paper>
        )}
      </Container>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          Share Contact
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <List>
            {shareOptions.map((option) => (
              <ListItem
                component="div"
                key={option.action}
                onClick={() => handleShareOptionSelect(option)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'primary.main',
                  minWidth: 40
                }}>
                  {option.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={option.label}
                  primaryTypographyProps={{
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qrCodeDialogOpen}
        onClose={() => setQrCodeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          Scan QR Code
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 3,
            bgcolor: 'background.default',
            borderRadius: 2,
            mb: 2
          }}>
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Contact QR Code"
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            )}
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary',
              bgcolor: 'background.default',
              p: 2,
              borderRadius: 2
            }}
          >
            Scan this QR code with your device's camera to import the contact
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            height: '90vh',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Typography variant="h6" component="div">
            {previewDoc?.name}
          </Typography>
          <IconButton 
            onClick={() => setPreviewOpen(false)}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          {previewDoc && renderDocumentPreview()}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={handleCloseSnackbar}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactDetails;