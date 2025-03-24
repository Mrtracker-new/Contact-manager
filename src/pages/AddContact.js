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

// Document validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

const AddContact = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { refreshContacts } = useContext(ContactsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    photo: null,
    documents: [],
    tags: [],
    groups: []
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const validateDocument = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Allowed types: PDF, JPEG, PNG, TXT, DOC/DOCX');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB');
    }
    return true;
  };

  const handleDocumentSelection = async (e) => {
    const files = Array.from(e.target.files);
    const processedDocs = [];

    for (const file of files) {
      try {
        validateDocument(file);
        processedDocs.push({
          id: Date.now().toString(),
          name: file.name,
          file,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        });
      } catch (error) {
        enqueueSnackbar(error.message, { variant: 'warning' });
      }
    }

    return processedDocs;
  };

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
          file: doc.fileData ? new Blob([doc.fileData], { type: doc.type }) : doc.file
        })),
        tags: contact.tags || [],
        groups: contact.groups || []
      };
      
      setFormData(safeContact);
      
      if (contact.photo) {
        try {
          if (typeof contact.photo === 'string') {
            setPhotoPreview(contact.photo);
          } else if (contact.photo instanceof Blob) {
            const preview = URL.createObjectURL(contact.photo);
            setPhotoPreview(preview);
          }
        } catch (error) {
          console.error('Error creating photo preview URL:', error);
        }
      }
    } catch (error) {
      enqueueSnackbar('Failed to load contact', { variant: 'error' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate, enqueueSnackbar]);

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const allGroups = await getAllGroups();
        setAvailableGroups(allGroups);

        const contactFromState = location.state?.contact;
        const isEditing = location.state?.isEditing;
        const contactId = location.state?.contactId || editId;
        
        if (isEditing && contactFromState) {
          const safeContact = {
            ...contactFromState,
            documents: (contactFromState.documents || []).map(doc => ({
              ...doc,
              file: doc.fileData ? new Blob([doc.fileData], { type: doc.type }) : doc.file
            })),
            tags: contactFromState.tags || [],
            groups: contactFromState.groups || []
          };
          
          setFormData(safeContact);
          
          if (contactFromState.photo) {
            if (typeof contactFromState.photo === 'string') {
              setPhotoPreview(contactFromState.photo);
            } else if (contactFromState.photo instanceof Blob) {
              setPhotoPreview(URL.createObjectURL(contactFromState.photo));
            }
          }
        } else if (contactId) {
          await loadContactFromStorage(contactId);
        }
      } catch (error) {
        enqueueSnackbar('Error initializing form', { variant: 'error' });
      }
    };

    initializeForm();

    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [location, editId, loadContactFromStorage, enqueueSnackbar, photoPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, photo: file }));
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        enqueueSnackbar('Invalid image file type', { variant: 'error' });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name too long (max 50 chars)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true); // Use setLoading instead of setSubmitting
      
      // Process documents
      const processedDocuments = await Promise.all(
        formData.documents.map(async doc => {
          // Skip processing if already processed
          if (doc.fileData) return doc;
          
          return {
            ...doc,
            fileData: doc.file instanceof Blob ? await blobToBase64(doc.file) : null
          };
        })
      );

      // Process photo
      let processedPhoto = formData.photo;
      if (formData.photo instanceof Blob) {
        processedPhoto = await blobToBase64(formData.photo);
      }

      const contactData = {
        ...formData,
        documents: processedDocuments,
        photo: processedPhoto
      };

      console.log('Saving contact data:', contactData);

      let savedContact;
      if (editId || location.state?.isEditing) {
        const contactId = editId || location.state.contactId;
        savedContact = await updateContact({ ...contactData, id: contactId });
        enqueueSnackbar('Contact updated successfully', { variant: 'success' });
      } else {
        savedContact = await addContact(contactData);
        enqueueSnackbar('Contact created successfully', { variant: 'success' });
      }

      console.log('Contact saved successfully:', savedContact);
      
      // Force refresh contacts
      if (refreshContacts) {
        await refreshContacts();
      }
      
      // Add a small delay before navigation to ensure storage is updated
      setTimeout(() => {
        navigate('/', { state: { refresh: true } });
      }, 300);
    } catch (error) {
      console.error('Save error:', error);
      enqueueSnackbar(error.message || 'Failed to save contact', { variant: 'error' });
    } finally {
      setLoading(false); // Use setLoading instead of setSubmitting
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDocumentChange = async (e) => {
    try {
      setLoading(true);
      const files = Array.from(e.target.files || []);
      
      if (!files.length) {
        return;
      }
      
      const newDocs = [];
      
      for (const file of files) {
        try {
          validateDocument(file);
          
          // Convert file to base64 immediately to prevent issues later
          const fileData = await blobToBase64(file);
          
          newDocs.push({
            id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            file: file,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            fileData: fileData // Store the base64 data immediately
          });
        } catch (error) {
          enqueueSnackbar(error.message, { variant: 'warning' });
        }
      }
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocs]
      }));
      
      enqueueSnackbar(`Added ${newDocs.length} document(s)`, { variant: 'success' });
    } catch (error) {
      console.error('Document upload error:', error);
      enqueueSnackbar('Failed to process documents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
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
          p: 4, 
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
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
                width: 120, 
                height: 120, 
                cursor: 'pointer',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': { 
                  opacity: 0.9,
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              {photoPreview ? null : <PhotoCameraIcon fontSize="large" />}
            </Avatar>
          </label>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click to {photoPreview ? 'change' : 'add'} photo
          </Typography>
        </Box>

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

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleTagRemove(tag)}
                  size="small"
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTagAdd()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button onClick={handleTagAdd} disabled={!newTag.trim()}>
                      Add
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Groups
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={availableGroups}
              value={formData.groups}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, groups: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Groups"
                  placeholder="Add groups"
                  helperText="Type to create new groups or select existing ones"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Documents
            </Typography>
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
                      p: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" component={Link} to="/">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {editId ? 'Update Contact' : 'Save Contact'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddContact;