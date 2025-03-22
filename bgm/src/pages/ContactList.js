import React, { useContext, useState, useMemo, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, 
  Avatar, IconButton, Button, TextField,
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

  // Create and cleanup avatar URLs
  useEffect(() => {
    const urls = {};
    contacts.forEach(contact => {
      if (contact.photo && contact.photo instanceof Blob) {
        try {
          urls[contact.id] = URL.createObjectURL(contact.photo);
        } catch (error) {
          console.error(`Failed to create URL for contact ${contact.id}:`, error);
        }
      }
    });
    setAvatarUrls(urls);

    return () => {
      // Clean up URLs when component unmounts
      Object.values(urls).forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error revoking object URL:', error);
        }
      });
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => {
      const nameMatch = contact.name?.toLowerCase().includes(query);
      const phoneMatch = contact.phone?.includes(query);
      const emailMatch = contact.email?.toLowerCase().includes(query);
      return nameMatch || phoneMatch || emailMatch;
    });
  }, [contacts, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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

      {filteredContacts.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          p: 4, 
          border: '1px dashed', 
          borderColor: 'divider',
          borderRadius: 2
        }}>
          <Typography variant="body1" color="text.secondary">
            No contacts found{matchMedia && searchQuery && ` for "${searchQuery}"`}
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
                aria-label={`View details for ${contact.name}`}
              >
                <Avatar
                  src={avatarUrls[contact.id]}
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    mr: 2,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem'
                  }}
                  alt={`${contact.name} avatar`}
                >
                  {contact.name.charAt(0)}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
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