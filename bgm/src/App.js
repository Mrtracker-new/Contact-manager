import React, { useState, useEffect, createContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import Dashboard from './components/Dashboard';
import AddContact from './pages/AddContact';
import ContactDetails from './pages/ContactDetails';
import { getContacts, initializeStorage } from './utils/contactsStorage';

// Create the context
export const ContactsContext = createContext();

function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Function to refresh contacts - memoized to prevent unnecessary re-renders
  const refreshContacts = useCallback(async () => {
    try {
      // Prevent multiple refreshes within 500ms
      const now = Date.now();
      if (now - lastRefresh < 500) {
        console.log('Skipping refresh - too soon since last refresh');
        return false;
      }
      
      setLastRefresh(now);
      setLoading(true);
      console.log('Refreshing contacts...');
      const loadedContacts = await getContacts();
      console.log('Loaded contacts:', loadedContacts?.length || 0);
      
      setContacts(Array.isArray(loadedContacts) ? loadedContacts : []);
      return true;
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [lastRefresh]); // Remove contacts from dependencies

  // Initialize storage and load contacts on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initializeStorage();
        await refreshContacts();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    init();
    // Only run this effect once on mount
  }, []); // Remove refreshContacts from dependencies

  // Create a separate effect for refreshing contacts when refreshCounter changes
  useEffect(() => {
    if (refreshCounter > 0) {
      refreshContacts();
    }
  }, [refreshCounter, refreshContacts]);

  // Create a function to trigger refresh without causing infinite loops
  const triggerRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <ContactsContext.Provider value={{ contacts, loading, refreshContacts: triggerRefresh }}>
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-contact" element={<AddContact />} />
              <Route path="/contact/:id" element={<ContactDetails />} />
            </Routes>
          </Router>
        </ContactsContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
