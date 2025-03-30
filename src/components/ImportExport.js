import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  QrCode as QrCodeIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import {
  exportToCSV,
  exportToVCard,
  exportToPDF,
  importFromCSV,
  importFromVCard,
  generateQRCode
} from '../utils/contactImportExport';

const ImportExport = ({ onImportComplete }) => {
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [qrCode, setQrCode] = useState(null);

  const handleExport = async (type) => {
    try {
      switch (type) {
        case 'csv':
          await exportToCSV();
          break;
        case 'vcard':
          await exportToVCard();
          break;
        case 'pdf':
          await exportToPDF();
          break;
      }
      setSnackbar({
        open: true,
        message: `Contacts exported successfully to ${type.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error exporting contacts: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleImport = async (file, type) => {
    try {
      let count;
      switch (type) {
        case 'csv':
          count = await importFromCSV(file);
          break;
        case 'vcard':
          count = await importFromVCard(file);
          break;
      }
      setSnackbar({
        open: true,
        message: `Successfully imported ${count} contacts`,
        severity: 'success'
      });
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error importing contacts: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      handleImport(file, type);
    }
  };

  const handleQRCode = async (contact) => {
    try {
      const qrDataUrl = await generateQRCode(contact);
      setQrCode(qrDataUrl);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error generating QR code: ${error.message}`,
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileUploadIcon />}
        onClick={() => setOpen(true)}
        sx={{ 
          mr: 2,
          borderColor: 'primary.main',
          color: 'primary.main',
          '&:hover': {
            borderColor: 'primary.dark',
            backgroundColor: 'primary.light',
            color: 'primary.dark'
          }
        }}
      >
        Import/Export
      </Button>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
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
          Import/Export Contacts
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <List>
            <ListItem sx={{ 
              mb: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}>
              <ListItemIcon>
                <FileUploadIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Import Contacts" 
                secondary="Import contacts from CSV or vCard files"
              />
              <Box>
                <input
                  accept=".csv"
                  id="csv-import"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'csv')}
                />
                <label htmlFor="csv-import">
                  <Button
                    component="span"
                    startIcon={<TableChartIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    CSV
                  </Button>
                </label>
                <input
                  accept=".vcf"
                  id="vcard-import"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'vcard')}
                />
                <label htmlFor="vcard-import">
                  <Button
                    component="span"
                    startIcon={<ContactMailIcon />}
                    variant="outlined"
                    size="small"
                  >
                    vCard
                  </Button>
                </label>
              </Box>
            </ListItem>

            <ListItem sx={{ 
              bgcolor: 'background.default',
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}>
              <ListItemIcon>
                <FileDownloadIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Export Contacts" 
                secondary="Export contacts to CSV, vCard, or PDF format"
              />
              <Box>
                <Button
                  startIcon={<TableChartIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => handleExport('csv')}
                  sx={{ mr: 1 }}
                >
                  CSV
                </Button>
                <Button
                  startIcon={<ContactMailIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => handleExport('vcard')}
                  sx={{ mr: 1 }}
                >
                  vCard
                </Button>
                <Button
                  startIcon={<DescriptionIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => handleExport('pdf')}
                >
                  PDF
                </Button>
              </Box>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2
        }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!qrCode}
        onClose={() => setQrCode(null)}
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
          Contact QR Code
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 2
          }}>
            <img 
              src={qrCode} 
              alt="Contact QR Code" 
              style={{ 
                maxWidth: '100%',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2
        }}>
          <Button onClick={() => setQrCode(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ImportExport; 