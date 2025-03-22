import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { 
  Container, Typography, Box, Paper, Avatar, IconButton, Dialog,
  DialogContent, DialogTitle, Snackbar, Alert, CircularProgress,
  Button, List, ListItem, ListItemIcon, ListItemText, Grid, Card,
  CardContent, Divider, Chip
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
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { ContactsContext } from '../App';
import { getContactById, deleteContact, updateContact } from '../utils/contactsStorage';
import { createSafeObjectURL, revokeSafeObjectURL, base64ToBlob } from '../utils/documentHandler';

// Add this function before the component
function dataURItoBlob(dataURI) {
  console.log('Converting data URI to blob');
  try {
    if (!dataURI) return null;
    if (typeof dataURI !== 'string') return null;
    if (dataURI.startsWith('blob:')) return null;
    
    if (dataURI.startsWith('data:')) {
      const parts = dataURI.split(',');
      if (parts.length < 2) return null;
      
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      
      const mimeString = mimeMatch[1];
      const base64 = parts[1];
      
      try {
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
      } catch (e) {
        console.error('Error decoding base64:', e);
        return null;
      }
    }
    
    try {
      const byteString = atob(dataURI);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: 'application/octet-stream' });
    } catch (e) {
      console.error('Error decoding plain base64:', e);
      return null;
    }
  } catch (error) {
    console.error('Error converting data URI to Blob:', error);
    return null;
  }
}

// Utility function for formatting file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ContactDetails = () => {
  console.log('ContactDetails component rendering');
  
  const [contact, setContact] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshContacts } = useContext(ContactsContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleShowMessage = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);
    
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    const loadContact = async () => {
      try {
        const loadedContact = await getContactById(id);
        if (!loadedContact) {
          navigate('/', { replace: true });
          return;
        }
  
        console.log('Raw loaded contact:', loadedContact);
        
        // Improve document normalization
        const normalizedContact = {
          ...loadedContact,
          documents: (loadedContact.documents || [])
            .filter(Boolean)
            .map(doc => {
              try {
                // Create a proper document object
                const normalizedDoc = {
                  ...doc,
                  id: doc.id || Date.now().toString(),
                  name: doc.name || 'Unnamed Document',
                  file: doc.file instanceof Blob ? 
                    doc.file : 
                    (doc.fileData ? dataURItoBlob(doc.fileData) : null)
                };
                
                // Log each document for debugging
                console.log('Normalized document:', {
                  id: normalizedDoc.id,
                  name: normalizedDoc.name,
                  fileType: normalizedDoc.file ? normalizedDoc.file.type : 'unknown',
                  fileSize: normalizedDoc.file ? normalizedDoc.file.size : 0
                });
                
                return normalizedDoc;
              } catch (error) {
                console.error('Error processing document:', error);
                return null;
              }
            })
            .filter(doc => doc && doc.file instanceof Blob)
        };
  
        console.log('Normalized contact documents:', normalizedContact.documents?.length || 0);
        setContact(normalizedContact);
      } catch (err) {
        setError('Failed to load contact details');
        handleShowMessage('Failed to load contact', 'error');
        console.error('Contact load error:', err);
      } finally {
        setLoading(false);
      }
    };
  
    loadContact();
  }, [id, navigate, handleShowMessage]);

  useEffect(() => {
    return () => {
      if (previewDoc) {
        const objectUrl = previewDoc.file instanceof Blob ? 
          URL.createObjectURL(previewDoc.file) : null;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };
  }, [previewDoc]);

  useEffect(() => {
    if (!previewOpen && previewDoc) setPreviewDoc(null);
  }, [previewOpen, previewDoc]);

  const handleDocumentAction = async (doc, action) => {
    try {
      if (!doc.file || !(doc.file instanceof Blob)) {
        throw new Error('Invalid file data');
      }
  
      // Android-specific file handling
      if (window.Capacitor) {
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const fileName = `${doc.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
        const path = `documents/${fileName}`;
        
        // Convert Blob to base64
        const base64Data = await blobToBase64(doc.file);
        
        // Write file to filesystem
        await Filesystem.writeFile({
          path,
          data: base64Data,
          directory: 'DOCUMENTS',
          recursive: true
        });
  
        // Get URI for sharing
        const uri = await Filesystem.getUri({
          directory: 'DOCUMENTS',
          path
        });
  
        switch(action) {
          case 'share':
            await Share.share({
              title: doc.name,
              url: uri.uri
            });
            break;
            
          case 'download':
            // On Android, files are already saved - just show toast
            await Toast.show({
              text: `File saved to Documents/${path}`,
              duration: 'long'
            });
            break;
        }
        
      } else {
        // Web handling remains the same
        const url = URL.createObjectURL(doc.file);
        
        switch(action) {
          case 'share':
            if (window.navigator.share) {
              await window.navigator.share({
                title: doc.name,
                text: `Sharing ${doc.name}`,
              });
            } else {
              await Share.share({
                title: doc.name,
                text: `Sharing ${doc.name} (${doc.file.type})`,
                dialogTitle: 'Share Document'
              });
            }
            break;
          
          case 'download':
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            handleShowMessage(`${doc.name} downloaded successfully`, 'success');
            break;
        }
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Document action error:', error);
      handleShowMessage(error.message || 'Document operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
      refreshContacts();
      navigate('/');
    }
  };

  const handleEdit = () => {
    const cleanContact = {
      ...contact,
      documents: contact.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        file: doc.file,
        fileData: undefined
      }))
    };
    
    navigate('/add-contact', { 
      state: { 
        isEditing: true,
        contactId: id,
        contact: cleanContact
      } 
    });
  };

  const handleShare = async () => {
    try {
      const contactInfo = [
        `Name: ${contact.name}`,
        contact.phone ? `Phone: ${contact.phone}` : '',
        contact.email ? `Email: ${contact.email}` : '',
        contact.address ? `Address: ${contact.address}` : '',
      ].filter(Boolean).join('\n');

      await Share.share({
        title: `Contact: ${contact.name}`,
        text: contactInfo,
        dialogTitle: 'Share Contact Information'
      });
    } catch (error) {
      console.error('Error sharing contact:', error);
      handleShowMessage('Failed to share contact', 'error');
    }
  };

  // Add the handleViewDocument and handleDeleteDocument functions
  const handleViewDocument = (doc) => {
    if (!doc || !doc.file) {
      handleShowMessage('Cannot view document: No data available', 'error');
      return;
    }
    
    try {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      handleShowMessage('Failed to open document preview', 'error');
    }
  };

  const refreshContactData = async () => {
    const updatedContact = await getContactById(id);
    setContact(updatedContact);
  };

  const handleDeleteDocument = async (index) => {
    try {
      if (!contact || !contact.id) return;
      
      console.log(`Deleting document at index ${index}`);
      
      // Create a copy of the contact with the document removed
      const updatedDocuments = [...contact.documents];
      const removedDoc = updatedDocuments.splice(index, 1)[0];
      console.log('Removed document:', removedDoc?.name);
      
      // Prepare documents for storage - convert Blobs to base64 strings
      const storageDocuments = await Promise.all(updatedDocuments.map(async (doc) => {
        if (doc.file instanceof Blob) {
          // Convert Blob to base64 for storage
          return {
            id: doc.id,
            name: doc.name,
            type: doc.file.type,
            fileData: await blobToBase64(doc.file)
          };
        }
        return doc;
      }));
      
      const updatedContact = {
        ...contact,
        documents: storageDocuments
      };
      
      console.log('Updating contact with documents:', updatedContact.documents?.length || 0);
      
      // Update the contact
      await updateContact(updatedContact);
      
      // Refresh the contact data with the normalized documents
      setContact({
        ...updatedContact,
        documents: updatedDocuments // Keep the Blob versions in the UI
      });
      
      handleShowMessage('Document deleted successfully', 'success');
      refreshContacts();
      await refreshContactData();
      
    } catch (error) {
      console.error('Error deleting document:', error);
      handleShowMessage('Failed to delete document', 'error');
    }
  };

  // Helper function to convert Blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const renderDocumentPreview = (doc) => {
    if (!doc?.file) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Preview not available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invalid file data
          </Typography>
        </Box>
      );
    }
  
    const fileBlob = doc.file instanceof Blob ? 
      doc.file : 
      (doc.fileData ? base64ToBlob(doc.fileData, doc.type) : null);
      
    if (!fileBlob) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Preview not available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Could not process file data
          </Typography>
        </Box>
      );
    }
    
    const objectUrl = createSafeObjectURL(fileBlob);
    
    return (
      <Box sx={{ position: 'relative', height: '80vh' }}>
        {fileBlob.type.startsWith('image/') ? (
          <img
            src={objectUrl}
            alt={doc.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              backgroundColor: '#f0f0f0'
            }}
            onLoad={() => revokeSafeObjectURL(objectUrl)}
            onError={() => revokeSafeObjectURL(objectUrl)}
          />
        ) : fileBlob.type === 'application/pdf' ? (
          <iframe
            title={doc.name}
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
        
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          display: 'flex', 
          gap: 1 
        }}>
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={() => handleDocumentAction(doc, 'share')}
            size="small"
          >
            Share
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleDocumentAction(doc, 'download')}
            size="small"
          >
            Download
          </Button>
        </Box>
      </Box>
    );
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
        <Box sx={{ position: 'relative', mb: 8 }}>
          <IconButton
            component={Link}
            to="/"
            sx={{ position: 'absolute', left: 0, top: -16 }}
          >
            <ArrowBackIcon fontSize="large" />
          </IconButton>
          
          <Box sx={{ 
            bgcolor: 'primary.main', 
            height: 160, 
            borderRadius: 3,
            position: 'relative'
          }}>
            <Avatar
              src={contact.photo instanceof Blob ? URL.createObjectURL(contact.photo) : undefined}
              onLoad={(e) => {
                if (e.target.src.startsWith('blob:')) {
                  URL.revokeObjectURL(e.target.src);
                }
              }}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid white',
                position: 'absolute',
                bottom: -60,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'primary.dark',
                fontSize: '3rem'
              }}
            >
              {contact.name.charAt(0)}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            {contact.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton onClick={handleEdit} color="primary" size="large">
              <EditIcon fontSize="large" />
            </IconButton>
            <IconButton onClick={handleDelete} color="error" size="large">
              <DeleteIcon fontSize="large" />
            </IconButton>
            <IconButton onClick={handleShare} color="primary" size="large">
              <ShareIcon fontSize="large" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          {[
            { icon: <CallIcon />, value: contact.phone, type: 'phone' },
            { icon: <EmailIcon />, value: contact.email, type: 'email' },
            { icon: <LocationIcon />, value: contact.address, type: 'address' }
          ].map((item, index) => (
            item.value && (
              <Paper key={index} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.value}
                  secondary={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                />
                {item.type === 'phone' && (
                  <IconButton href={`tel:${item.value}`}>
                    <CallIcon />
                  </IconButton>
                )}
                {item.type === 'email' && (
                  <IconButton href={`mailto:${item.value}`}>
                    <EmailIcon />
                  </IconButton>
                )}
              </Paper>
            )
          ))}
        </Box>

        {contact.documents?.length > 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Attachments ({contact.documents.length})
            </Typography>
            <List>
              {contact.documents.map((doc, index) => {
                console.log(`Rendering document ${index}:`, {
                  name: doc.name,
                  type: doc.file?.type,
                  size: doc.file?.size
                });
                
                if (!doc || !doc.file) {
                  console.error('Invalid document at index', index);
                  return null;
                }
                
                return (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Box sx={{ display: 'flex' }}>
                        <IconButton onClick={() => {
                          console.log('Opening preview for document:', doc.name);
                          setPreviewDoc(doc);
                          setPreviewOpen(true);
                        }}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDocumentAction(doc, 'share')}>
                          <ShareIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDocumentAction(doc, 'download')}>
                          <FileDownloadIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteDocument(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                    sx={{ transition: 'background-color 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemIcon>
                      {doc.file?.type?.startsWith('image/') ? <ImageIcon /> :
                       doc.file?.type === 'application/pdf' ? <PictureAsPdfIcon /> :
                       <TextSnippetIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name || 'Unnamed Document'}
                      secondary={doc.file ? `${formatFileSize(doc.file.size)}` : 'Unknown size'}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No attachments found for this contact
            </Typography>
          </Paper>
        )}
      </Container>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {previewDoc?.name}
          <IconButton onClick={() => setPreviewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewDoc && renderDocumentPreview(previewDoc)}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactDetails;