import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { exportContacts, importContacts } from '../utils/contactsStorage';

const Settings = ({ open, onClose, onContactsChanged }) => {
  const [fileInput, setFileInput] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleExport = () => {
    const success = exportContacts();
    if (success) {
      setSnackbar({
        open: true,
        message: 'Contacts exported successfully!',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to export contacts.',
        severity: 'error'
      });
    }
  };

  const handleImportClick = () => {
    fileInput.click();
  };

  const handleImportFile = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        await importContacts(file);
        setSnackbar({
          open: true,
          message: 'Contacts imported successfully!',
          severity: 'success'
        });
        onContactsChanged();
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to import contacts. Invalid file format.',
          severity: 'error'
        });
      }
      // Reset file input
      e.target.value = null;
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all contacts? This action cannot be undone.')) {
      localStorage.removeItem('contacts');
      setSnackbar({
        open: true,
        message: 'All contacts have been deleted.',
        severity: 'info'
      });
      onContactsChanged();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              All your contact data is stored locally on your device. You can export your data as a backup or import previously exported data.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={handleExport}
              >
                Export Contacts
              </Button>
              
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
                ref={(input) => setFileInput(input)}
              />
              
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={handleImportClick}
              >
                Import Contacts
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Danger Zone
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleClearAll}
            >
              Delete All Contacts
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Settings;