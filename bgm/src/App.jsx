import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { initializeStorage } from './utils/contactsStorage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ContactDetails from './components/ContactDetails';
import AddContact from './components/AddContact';
import { theme } from './theme';

function App() {
  useEffect(() => {
    const init = async () => {
      await initializeStorage();
    };
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contact/:id" element={<ContactDetails />} />
          <Route path="/add-contact" element={<AddContact />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;