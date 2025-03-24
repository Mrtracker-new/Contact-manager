import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Container
} from '@mui/material';
import { Link } from 'react-router-dom';
import ContactsIcon from '@mui/icons-material/Contacts';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Settings from './Settings';
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <AppBar position="static" elevation={0} sx={{ 
      background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
      boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)'
    }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0 } }}>
          <Box 
            component={Link} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              flexGrow: 1
            }}
          >
            <ContactsIcon sx={{ fontSize: 32, mr: 1.5 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              RNR Contact Manager
            </Typography>
          </Box>
          
          <Button 
            component={Link} 
            to="/add-contact" 
            variant="contained" 
            color="secondary"
            sx={{ 
              color: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }
            }}
          >
            Add Contact
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;