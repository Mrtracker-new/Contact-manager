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
import ContactsIcon from '@mui/icons-material/Contacts';

const Header = () => {
  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        color: 'text.primary'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}>
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
            <Box 
              sx={{ 
                background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
                borderRadius: '12px',
                p: 1,
                mr: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(86, 103, 255, 0.3)'
              }}
            >
              <ContactsIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #212121, #757575)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              RNR Contact Manager
            </Typography>
          </Box>
          
          <Button 
            component={Link} 
            to="/add-contact" 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 2.5,
              py: 1,
              background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
              boxShadow: '0 4px 12px rgba(86, 103, 255, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(86, 103, 255, 0.4)',
                transform: 'translateY(-2px)'
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