import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Fab,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { ContactsContext } from '../App';

const Dashboard = () => {
  const { contacts, loading, refreshContacts } = useContext(ContactsContext);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(false);
  
  // Memoize the refresh function to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    // Only refresh if we're not already loading
    if (!localLoading) {
      setLocalLoading(true);
      await refreshContacts();
      setLocalLoading(false);
    }
  }, [refreshContacts, localLoading]);
  
  // Only refresh on initial mount and when explicitly navigating back
  useEffect(() => {
    console.log('Dashboard mounted or location changed');
    handleRefresh();
    // We're removing location.key from dependencies to prevent flickering
  }, [handleRefresh]); 
  
  // Additional refresh only if state explicitly contains refresh flag
  useEffect(() => {
    if (location.state?.refresh === true) {
      console.log('Refreshing contacts due to navigation state');
      // Clear the state to prevent multiple refreshes
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location.state, handleRefresh]);

  // Filter contacts based on search term - memoize this for performance
  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact =>
      (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  console.log('Rendering Dashboard with contacts:', contacts.length);

  // Determine if we should show loading state
  const isLoading = loading || localLoading;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Contacts ({contacts.length})
        </Typography>
        <Fab
          color="primary"
          component={Link}
          to="/add-contact"
          aria-label="add contact"
        >
          <AddIcon />
        </Fab>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 6 
        }}>
          <CircularProgress 
            size={60} 
            thickness={4} 
            sx={{ 
              color: 'primary.main',
              mb: 2
            }} 
          />
          <Typography variant="body1" color="text.secondary">
            Loading your contacts...
          </Typography>
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No contacts found. Add your first contact!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card
                component={Link}
                to={`/contact/${contact.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  height: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Avatar
                      src={contact.photo}
                      sx={{
                        width: 80,
                        height: 80,
                        mb: 2,
                        fontSize: '2rem',
                        background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
                      }}
                    >
                      {contact.name ? contact.name.charAt(0).toUpperCase() : <PersonIcon />}
                    </Avatar>
                    <Typography variant="h6" component="h2" align="center" sx={{ fontWeight: 600 }}>
                      {contact.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {contact.email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {contact.phone}
                    </Typography>
                    
                    {contact.tags && contact.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            sx={{ 
                              background: 'rgba(63, 81, 181, 0.1)',
                              color: 'primary.main',
                              fontWeight: 500,
                            }} 
                          />
                        ))}
                        {contact.tags.length > 3 && (
                          <Chip 
                            label={`+${contact.tags.length - 3}`} 
                            size="small" 
                            sx={{ 
                              background: 'rgba(63, 81, 181, 0.05)',
                              color: 'primary.main',
                            }} 
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;