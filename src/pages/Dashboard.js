import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  CardActions, Button, TextField, Box, Avatar, 
  IconButton, Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getContacts, deleteContact } from '../utils/contactsStorage';

const Dashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load contacts from storage
    const loadContacts = async () => {
      try {
        setLoading(true);
        const loadedContacts = await getContacts();
        setContacts(loadedContacts);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadContacts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
      setContacts(contacts.filter(contact => contact.id !== id));
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Contacts
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/add-contact"
        >
          Add New Contact
        </Button>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>
      
      <Grid container spacing={3}>
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible'
              }}>
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    mb: 2 
                  }}>
                    <Avatar 
                      src={contact.photo ? URL.createObjectURL(contact.photo) : ''} 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mb: 2,
                        border: '4px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {contact.name.charAt(0)}
                    </Avatar>
                    <Typography variant="h6" component="div" align="center" gutterBottom>
                      {contact.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>
                        📱
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {contact.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        bgcolor: 'secondary.light', 
                        color: 'secondary.contrastText',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>
                        ✉️
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {contact.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ 
                  justifyContent: 'space-between', 
                  bgcolor: 'background.default',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12
                }}>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/contact/${contact.id}`}
                    sx={{ fontWeight: 'medium' }}
                  >
                    View Details
                  </Button>
                  <Box>
                    <IconButton 
                      component={Link} 
                      to={`/add-contact?edit=${contact.id}`}
                      color="primary"
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(contact.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mt: 4 }}>
              {searchTerm ? 'No contacts match your search' : 'No contacts found. Add your first contact!'}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;