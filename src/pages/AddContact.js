import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, Grid, Avatar, IconButton, Chip, 
  InputAdornment, Divider, Autocomplete, CircularProgress
} from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { ContactsContext } from '../App';
import { 
  getContactById, 
  updateContact, 
  addContact,
  getContacts
} from '../utils/contactsStorage';
import { useSnackbar } from 'notistack';
import { compressImage } from '../utils/documentHandler';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // Reduced to 2MB from 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const getAllGroups = async () => {
  try {
    const contacts = await getContacts();
    const groupSet = new Set();
    contacts.forEach(contact => {
      if (contact.groups) {
        contact.groups.forEach(group => groupSet.add(group));
      }
    });
    return Array.from(groupSet);
  } catch (error) {
    console.error('Error loading groups:', error);
    return [];
  }
};

// In component declaration
const initialFormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  photo: null,
  documents: [],
  tags: [],
  groups: []
};

const AddContact = () => {
  // State hooks must be declared at the top
  const [formData, setFormData] = useState(initialFormState);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  // Add missing context destructuring
  const { refreshContacts } = useContext(ContactsContext);
  
  // Ensure all hooks are properly initialized
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Add near top with other state declarations
  const [availableGroups, setAvailableGroups] = useState([]);
  
  // Add this useEffect for group loading
  useEffect(() => {
    const loadGroups = async () => {
      const groups = await getAllGroups();
      setAvailableGroups(groups);
    };
    loadGroups();
  }, []);
  
  // Add document change handler before handleSubmit
  const handleDocumentChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          enqueueSnackbar(`File ${file.name} is too large. Maximum size is 2MB.`, { variant: 'warning' });
          return false;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          enqueueSnackbar(`File ${file.name} has an unsupported type.`, { variant: 'warning' });
          return false;
        }
        return true;
      });

      // Check for duplicate file names including existing documents
      const existingFileNames = formData.documents.map(doc => doc.name);
      const newDocuments = await Promise.all(
        validFiles.filter(file => !existingFileNames.includes(file.name)).map(async (file) => {
          const docId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const newDoc = {
            id: docId,
            name: file.name,
            file: file,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file)
          };
          return newDoc;
        })
      );

      if (validFiles.length !== newDocuments.length) {
        enqueueSnackbar('Some files were skipped as they were already attached', { variant: 'info' });
      }

      // Preserve existing documents and add new ones
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocuments]
      }));
    } catch (error) {
      console.error('Error handling documents:', error);
      enqueueSnackbar('Error processing documents', { variant: 'error' });
    }
  };
  
  // Move utility functions INSIDE component
  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };
  
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

// Keep only ONE loadContactFromStorage declaration
const loadContactFromStorage = useCallback(async (contactId) => {
  try {
    setLoading(true);
    const contact = await getContactById(contactId);
    if (!contact) {
      navigate('/');
      return;
    }

    const safeContact = {
      ...contact,
      documents: (contact.documents || []).map(doc => ({
        ...doc,
        file: doc.fileData ? dataURLtoBlob(doc.fileData) : doc.file,
        url: doc.fileData ? URL.createObjectURL(dataURLtoBlob(doc.fileData)) : doc.url
      })),
      tags: contact.tags || [],
      groups: contact.groups || []
    };
    
    // Improved photo handling
    let photoBlob = null;
    let photoPreviewUrl = null;
    
    // First try to use the contact.photo if it's a Blob
    if (contact.photo instanceof Blob) {
      photoBlob = contact.photo;
      photoPreviewUrl = URL.createObjectURL(photoBlob);
    }
    // Then try to convert from string if it's a data URL
    else if (contact.photo && typeof contact.photo === 'string' && contact.photo.startsWith('data:')) {
      try {
        photoBlob = dataURLtoBlob(contact.photo);
        if (photoBlob) {
          photoPreviewUrl = URL.createObjectURL(photoBlob);
        }
      } catch (photoError) {
        console.error('Error converting photo data URL to blob:', photoError);
      }
    }
    // Finally, try to use photoData if available
    if (!photoBlob && contact.photoData && contact.photoData.data) {
      try {
        photoBlob = dataURLtoBlob(contact.photoData.data);
        if (photoBlob) {
          photoPreviewUrl = URL.createObjectURL(photoBlob);
        }
      } catch (photoDataError) {
        console.error('Error converting photoData to blob:', photoDataError);
      }
    }
    
    // Update the contact with the processed photo
    safeContact.photo = photoBlob;
    
    // Set form data
    setFormData(safeContact);
    
    // Set photo preview if available
    if (photoPreviewUrl) {
      setPhotoPreview(photoPreviewUrl);
    }
  } catch (error) {
    console.error('Failed to load contact:', error);
    enqueueSnackbar('Failed to load contact', { variant: 'error' });
    navigate('/');
  } finally {
    setLoading(false);
  }
}, [navigate, enqueueSnackbar]); // Removed refreshContacts from deps as it's not used

// In useEffect dependencies
useEffect(() => {
  const initializeForm = async () => {
    try {
      // Check if we're in edit mode by looking at the URL
      const params = new URLSearchParams(location.search);
      const contactFromState = location.state?.contact;
      
      // Get the contact ID from the URL params (for /edit-contact/:id route)
      const urlContactId = location.pathname.includes('/edit-contact/') 
        ? location.pathname.split('/edit-contact/')[1]
        : null;
      
      // Use the ID from URL params or from the state
      const contactId = urlContactId || params.get('id') || editId;
      
      if (contactFromState) {
        // Initialize form with contact data from state
        // In the useEffect initialization
        setFormData({
          ...initialFormState,
          ...contactFromState,
          documents: (contactFromState.documents || []).map(doc => ({
            ...doc,
            url: doc.fileData ? URL.createObjectURL(dataURLtoBlob(doc.fileData)) : doc.url
          }))
        });
        
        // Improved photo preview handling
        let previewUrl = null;
        
        // First try to use the contact.photo if it's a Blob
        if (contactFromState.photo instanceof Blob) {
          previewUrl = URL.createObjectURL(contactFromState.photo);
        }
        // Then try to convert from string if it's a data URL
        else if (contactFromState.photo && typeof contactFromState.photo === 'string' && contactFromState.photo.startsWith('data:')) {
          try {
            const photoBlob = dataURLtoBlob(contactFromState.photo);
            if (photoBlob) {
              previewUrl = URL.createObjectURL(photoBlob);
            } else {
              // If conversion fails, use the data URL directly
              previewUrl = contactFromState.photo;
            }
          } catch (photoError) {
            console.error('Error converting photo data URL to blob:', photoError);
            // Use the data URL directly if conversion fails
            previewUrl = contactFromState.photo;
          }
        }
        // Finally, try to use photoData if available
        else if (contactFromState.photoData && contactFromState.photoData.data) {
          try {
            const photoBlob = dataURLtoBlob(contactFromState.photoData.data);
            if (photoBlob) {
              previewUrl = URL.createObjectURL(photoBlob);
            }
          } catch (photoDataError) {
            console.error('Error converting photoData to blob:', photoDataError);
          }
        }
        
        // Set photo preview if available
        if (previewUrl) {
          setPhotoPreview(previewUrl);
        }
      } else if (contactId) {
        // If no contact in state but ID is available, load from storage
        await loadContactFromStorage(contactId);
      }
    } catch (error) {
      console.error('Error initializing form:', error);
      enqueueSnackbar('Error initializing form', { variant: 'error' });
    }
  };

  initializeForm();

  // In the useEffect cleanup function
  return () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    // Add document URL cleanup
    formData.documents.forEach(doc => {
      if (doc.url && doc.url.startsWith('blob:')) {
        URL.revokeObjectURL(doc.url);
      }
    });
  };
}, [location, editId, loadContactFromStorage, enqueueSnackbar]); // Removed photoPreview from dependencies

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  setErrors(prev => ({ ...prev, [name]: null }));
};

// Update the handlePhotoChange function to compress images
const handlePhotoChange = async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.type.startsWith('image/')) {
      try {
        setLoading(true);
        
        // Compress the image
        const compressedImage = await compressImage(file, 800, 0.7);
        
        // Create a preview URL
        const previewUrl = URL.createObjectURL(compressedImage);
        
        // Update form data and preview
        setFormData(prev => ({ ...prev, photo: compressedImage }));
        setPhotoPreview(previewUrl);
        
        // Clean up old preview URL if it exists
        if (photoPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(photoPreview);
        }
        
        if (compressedImage.size > MAX_FILE_SIZE) {
          enqueueSnackbar('Image compressed but still large. This may cause performance issues.', { 
            variant: 'warning' 
          });
        }
      } catch (error) {
        console.error('Error processing photo:', error);
        enqueueSnackbar('Error processing photo', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      enqueueSnackbar('Please select an image file', { variant: 'warning' });
    }
  }
};
// Update the handleSubmit function to process files more efficiently
// Add these functions before the handleSubmit function

// Add validateForm function
const validateForm = () => {
  const newErrors = {};
  if (!formData.name.trim()) newErrors.name = 'Name is required';
  if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
  if (!formData.email.trim()) newErrors.email = 'Email is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Add removeDocument function
const removeDocument = (index) => {
  const updatedDocs = [...formData.documents];
  const [removedDoc] = updatedDocs.splice(index, 1);
  if (removedDoc.url) URL.revokeObjectURL(removedDoc.url);
  setFormData({ ...formData, documents: updatedDocs });
};

// Update the handleSubmit function to properly handle document updates without creating duplicates
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    setErrors({});

    // Basic validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    // Get existing contacts
    const existingContacts = await getContacts();
    
    // Create contact object with trimmed values and unique ID
    const contactData = {
      id: formData.id || `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      address: formData.address?.trim() || '',
      notes: formData.notes?.trim() || '',
      documents: [],
      photo: formData.photo || null,
      tags: formData.tags || [],
      groups: formData.groups || [],
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check for exact duplicates (excluding the current contact being edited)
    const exactDuplicate = existingContacts.find(c => 
      c.id !== contactData.id && 
      c.phone === contactData.phone && 
      c.email === contactData.email
    );

    if (exactDuplicate) {
      setErrors({ 
        phone: 'Phone number already exists',
        email: 'Email already exists'
      });
      enqueueSnackbar('Contact with same phone and email already exists', { variant: 'error' });
      return;
    }

    // Process documents
    const processedDocuments = await Promise.all(
      formData.documents.map(async (doc) => {
        try {
          // If document already has processed data, return it as is
          if (doc.data) {
            return {
              id: doc.id,
              name: doc.name,
              data: doc.data,
              type: doc.type,
              size: doc.size,
              isFileSystem: false
            };
          }

          // If document has a file, process it
          if (doc.file) {
            const base64Data = await blobToBase64(doc.file);
            if (!base64Data) return null;

            return {
              id: doc.id,
              name: doc.name,
              data: base64Data,
              type: doc.type,
              size: doc.size,
              isFileSystem: false
            };
          }

          // If neither data nor file exists, preserve the original document
          return doc;
        } catch (error) {
          console.error('Error processing document:', error);
          return null;
        }
      })
    ).then(results => results.filter(Boolean));

    // Add processed documents to contact data
    contactData.documents = processedDocuments;

    // Save or update contact
    if (editId) {
      await updateContact(contactData.id, contactData);
      enqueueSnackbar('Contact updated successfully', { variant: 'success' });
    } else {
      await addContact(contactData);
      enqueueSnackbar('Contact added successfully', { variant: 'success' });
    }

    // Refresh contacts list and navigate back
    await refreshContacts();
    navigate('/');
  } catch (err) {
    console.error('Submit error:', err);
    enqueueSnackbar(err.message || 'Failed to save contact', { variant: 'error' });
  } finally {
    setLoading(false);
  }
};

// Helper function to calculate name similarity
const calculateNameSimilarity = (name1, name2) => {
  if (!name1 || !name2) return 0;
  
  // Convert to lowercase and remove special characters
  const cleanName1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanName2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // If either name is empty after cleaning, return 0
  if (!cleanName1 || !cleanName2) return 0;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(cleanName1, cleanName2);
  const maxLength = Math.max(cleanName1.length, cleanName2.length);
  
  // Convert distance to similarity score (0 to 1)
  return 1 - (distance / maxLength);
};

// Helper function to calculate Levenshtein distance
const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const handleTagAdd = () => {
  const trimmedTag = newTag.trim();
  if (trimmedTag && !formData.tags.includes(trimmedTag)) {
    setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    setNewTag('');
  }
};

const handleTagRemove = (tagToRemove) => {
  setFormData(prev => ({
    ...prev,
    tags: prev.tags.filter(tag => tag !== tagToRemove)
  }));
};

return (
  <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
      <IconButton component={Link} to="/" sx={{ mr: 2 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" component="h1">
        {editId ? 'Edit Contact' : 'Add New Contact'}
      </Typography>
    </Box>

    {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )}

    <Paper 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        p: { xs: 3, md: 5 }, 
        borderRadius: 4,
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '6px',
          background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <input
          accept="image/*"
          id="photo-upload"
          type="file"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="photo-upload">
          <Avatar 
            src={photoPreview} 
            sx={{ 
              width: 140, 
              height: 140, 
              cursor: 'pointer',
              border: '5px solid white',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'scale(1.05)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
              }
            }}
          >
            {photoPreview ? null : <PhotoCameraIcon sx={{ fontSize: 50, opacity: 0.8 }} />}
          </Avatar>
        </label>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
          Click to {photoPreview ? 'change' : 'add'} photo
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              inputProps={{ maxLength: 50 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Additional Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Documents
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <input
              accept={ALLOWED_FILE_TYPES.join(',')}
              id="document-upload"
              type="file"
              multiple
              onChange={handleDocumentChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="document-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AttachFileIcon />}
                sx={{ mb: 2 }}
              >
                Attach Documents
              </Button>
            </label>

            {formData.documents.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {formData.documents.map((doc, index) => (
                  <Box 
                    key={doc.id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1.5,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'rgba(86, 103, 255, 0.03)',
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                      {doc.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => removeDocument(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Tags
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
              />
              <Button 
                variant="contained" 
                onClick={handleTagAdd}
                disabled={!newTag.trim()}
                sx={{ minWidth: '100px' }}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleTagRemove(tag)}
                  sx={{ 
                    background: 'rgba(86, 103, 255, 0.08)',
                    color: 'primary.main',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Groups
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableGroups}
              value={formData.groups}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, groups: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Groups"
                  placeholder="Add to groups"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    sx={{ 
                      background: 'rgba(86, 103, 255, 0.08)',
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  />
                ))
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          component={Link} 
          to="/"
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1.2,
            borderWidth: 2,
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={loading}
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1.2,
            boxShadow: '0 4px 14px rgba(86, 103, 255, 0.4)',
          }}
        >
          {editId ? 'Update Contact' : 'Save Contact'}
        </Button>
      </Box>
    </Paper>
  </Container>
);
};

export default AddContact;