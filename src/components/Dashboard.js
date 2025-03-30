import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  CircularProgress,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import { ContactsContext } from '../App';
import { base64ToBlob } from '../utils/documentHandler';
import ImportExport from './ImportExport';

// Memoize the contact card to prevent unnecessary re-renders
const ContactCard = React.memo(({ contact }) => {
  // Create and manage avatar URL
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // Create avatar URL when contact changes
  useEffect(() => {
    let url = null;
    
    if (contact.photo instanceof Blob) {
      url = URL.createObjectURL(contact.photo);
    } else if (contact.photoData?.data) {
      const blob = base64ToBlob(contact.photoData.data, contact.photoData.type || 'image/jpeg');
      url = URL.createObjectURL(blob);
    }
    
    setAvatarUrl(url);
    
    // Clean up URL when component unmounts or contact changes
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [contact.photo, contact.photoData]);
  
  return (
    <Card
      sx={{
        display: 'block',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 16px 30px rgba(0,0,0,0.15)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::after': {
          opacity: 1,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 2,
          position: 'relative'
        }}>
          <Avatar
            src={avatarUrl}
            sx={{
              width: 90,
              height: 90,
              mb: 2,
              fontSize: '2.2rem',
              background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
              border: '4px solid white',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            }}
          >
            {!avatarUrl && contact.name ? contact.name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />}
          </Avatar>
          <Typography variant="h6" component="h2" align="center" sx={{ fontWeight: 600, mb: 0.5 }}>
            {contact.name}
          </Typography>
          {contact.email && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 0.5 }}>
              {contact.email}
            </Typography>
          )}
          {contact.phone && (
            <Typography variant="body2" color="text.secondary" align="center">
              {contact.phone}
            </Typography>
          )}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0,
            display: 'flex',
            gap: 1
          }}>
            <Tooltip title="Edit Contact">
              <IconButton
                component={Link}
                to={`/edit-contact/${contact.id}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'white',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: 1
        }}>
          <Button
            component={Link}
            to={`/contact/${contact.id}`}
            variant="outlined"
            color="primary"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              }
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the contact ID changes or if the contact data has changed
  return prevProps.contact.id === nextProps.contact.id && 
         prevProps.contact.name === nextProps.contact.name &&
         prevProps.contact.email === nextProps.contact.email &&
         prevProps.contact.phone === nextProps.contact.phone &&
         prevProps.contact.photo === nextProps.contact.photo &&
         prevProps.contact.photoData === nextProps.contact.photoData;
});

const Dashboard = () => {
  const { contacts, loading, refreshContacts } = useContext(ContactsContext);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  
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
    // Remove console.log to improve performance
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Using empty dependency array with eslint disable to ensure this only runs once on mount
  
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
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  // Removed console.log to improve performance

  // Determine if we should show loading state
  const isLoading = loading || localLoading;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3 
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 0 } }}>
          Contacts
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <ImportExport onImportComplete={refreshContacts} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-contact')}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Contact
          </Button>
        </Box>
      </Box>
    
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search contacts by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white',
            }
          }}
        />
      </Paper>
    
      {isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 8,
          minHeight: '300px'
        }}>
          <CircularProgress 
            size={60} 
            thickness={4} 
            sx={{ 
              color: 'primary.main',
              mb: 3
            }} 
          />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            Loading your contacts...
          </Typography>
        </Box>
      ) : filteredContacts.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          p: 8, 
          borderRadius: 4,
          backgroundColor: 'rgba(86, 103, 255, 0.03)',
          border: '1px dashed rgba(86, 103, 255, 0.2)',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box component="img" src="/images/empty-contacts.svg" alt="No contacts" sx={{ width: 120, height: 120, mb: 3, opacity: 0.7 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No contacts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            {searchTerm ? "Try a different search term or clear your search" : "Add your first contact to get started"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/add-contact"
            startIcon={<AddIcon />}
          >
            Add New Contact
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <ContactCard contact={contact} />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Add a floating action button for mobile view */}
      <Fab
        color="primary"
        aria-label="add contact"
        component={Link}
        to="/add-contact"
        sx={{
          position: 'fixed',
          bottom: 16, // Increased from bottom edge
          right: 16, // Increased from right edge
          zIndex: 1000,
          display: { xs: 'flex', sm: 'none' }, // Only show on mobile
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default Dashboard;
