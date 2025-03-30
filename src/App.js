import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh contacts - memoized to prevent unnecessary re-renders
  const refreshContacts = useCallback(async (force = false) => {
    try {
      // Prevent multiple refreshes within 500ms unless forced
      const now = Date.now();
      if (!force && now - lastRefresh < 500) {
        console.log('Skipping refresh - too soon since last refresh');
        return false;
      }
      
      // Prevent concurrent refreshes
      if (isRefreshing) {
        console.log('Skipping refresh - already refreshing');
        return false;
      }

      setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, [lastRefresh, isRefreshing]);

  // Initialize storage and load contacts on app start
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await initializeStorage();
        if (mounted) {
          await refreshContacts(true); // Force initial refresh
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    init();

    return () => {
      mounted = false;
    };
  }, []); // Only run on mount

  // Create a separate effect for refreshing contacts when refreshCounter changes
  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      if (refreshCounter > 0 && mounted) {
        await refreshContacts(true); // Force refresh when counter changes
      }
    };

    refresh();

    return () => {
      mounted = false;
    };
  }, [refreshCounter]); // Only depend on refreshCounter

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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    contacts, 
    loading, 
    refreshContacts: triggerRefresh
  }), [contacts, loading, triggerRefresh]);

  // Memoize the theme to prevent unnecessary re-renders
  const memoizedTheme = useMemo(() => theme, []); // Empty dependency array since theme is constant

  return (
    <ThemeProvider theme={memoizedTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <ContactsContext.Provider value={contextValue}>
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-contact" element={<AddContact />} />
              <Route path="/contact/:id" element={<ContactDetails />} />
              <Route path="/edit-contact/:id" element={<AddContact />} />
            </Routes>
          </Router>
        </ContactsContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
