import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Avatar, Button, TextField,
  InputAdornment, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { ContactsContext } from '../App';

const ContactList = () => {
  const { contacts, loading } = useContext(ContactsContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrls, setAvatarUrls] = useState({});

  // Create and manage avatar URLs
  useEffect(() => {
    const newUrls = {};
    
    // Create URLs for contacts with photos
    contacts.forEach(contact => {
      if (contact.photo instanceof Blob) {
        try {
          // Create new URL only if we don't have one for this contact
          if (!avatarUrls[contact.id]) {
            newUrls[contact.id] = URL.createObjectURL(contact.photo);
          } else {
            // Keep existing URL if we already have one
            newUrls[contact.id] = avatarUrls[contact.id];
          }
        } catch (error) {
          console.error('Error creating avatar URL:', error);
        }
      }
    });

    // Cleanup unused URLs
    Object.keys(avatarUrls).forEach(id => {
      if (!contacts.some(c => c.id === id)) {
        URL.revokeObjectURL(avatarUrls[id]);
      }
    });

    setAvatarUrls(newUrls);

    // Cleanup function
    return () => {
      Object.values(newUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [contacts]);

  // Optimized search filter
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(contact => {
      return [
        contact.name?.toLowerCase(),
        contact.phone?.replace(/\D/g, ''),
        contact.email?.toLowerCase()
      ].some(field => field?.includes(query));
    });
  }, [contacts, searchQuery]);

  // Debounced search handler
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 2,
        mb: 3 
      }}>
        <Typography variant="h4" component="h1">
          Contacts
        </Typography>
        <Button
          component={Link}
          to="/add-contact"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Contact
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
        InputProps={{
          'aria-label': 'Search contacts',
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          p: 4, 
          border: '1px dashed', 
          borderColor: 'divider',
          borderRadius: 2
        }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? `No results for "${searchQuery}"` : 'No contacts found'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Paper
                component={Link}
                to={`/contact/${contact.id}`}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    backgroundColor: 'action.hover'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  }
                }}
              >
                <Avatar
                  src={avatarUrls[contact.id]}
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    mr: 2,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {contact.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="h2"
                    noWrap
                    sx={{ fontWeight: 500 }}
                  >
                    {contact.name}
                  </Typography>
                  {contact.phone && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      noWrap
                    >
                      {contact.phone}
                    </Typography>
                  )}
                  {contact.email && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      noWrap
                      sx={{ 
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {contact.email}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ContactList;