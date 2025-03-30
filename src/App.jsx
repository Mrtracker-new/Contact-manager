import React, { useState, useEffect, createContext, useCallback, useRef, useMemo } from 'react';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { getContacts, initializeStorage } from './utils/contactsStorage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ContactDetails from './components/ContactDetails';
import AddContact from './components/AddContact';
import { theme } from './theme';

export const ContactsContext = createContext();

function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastRefreshTime = useRef(0);

  const refreshContacts = useCallback(async (force = false) => {
    try {
      const now = Date.now();
      if (!force && now - lastRefreshTime.current < 500) return;
      
      lastRefreshTime.current = now;
      setLoading(true);
      setError(null);

      const loadedContacts = await getContacts();
      setContacts(Array.isArray(loadedContacts) ? loadedContacts : []);
    } catch (err) {
      console.error('Error refreshing contacts:', err);
      setError('Failed to load contacts. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWithDebounce = useCallback(() => {
    refreshContacts(true);
  }, [refreshContacts]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeStorage();
        await refreshContacts();
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize application storage.');
      }
    };

    initializeApp();
  }, [refreshContacts]);

  const contextValue = useMemo(() => ({
    contacts,
    loading,
    error,
    refreshContacts: refreshWithDebounce,
  }), [contacts, loading, error, refreshWithDebounce]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ContactsContext.Provider value={contextValue}>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contact/:id" element={<ContactDetails />} />
            <Route path="/add-contact" element={<AddContact />} />
            <Route path="/edit-contact/:id" element={<AddContact />} />
          </Routes>
        </Router>
      </ContactsContext.Provider>
    </ThemeProvider>
  );
}

export default App;