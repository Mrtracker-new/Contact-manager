import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUp } from 'react-icons/fi';
import styled from 'styled-components';

// Styles
import GlobalStyle from './styles/GlobalStyle';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackgroundEffect from './components/BackgroundEffect';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));

// ScrollToTop component to handle scrolling to top on page change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll effect with passive event listener for better performance
  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button when user scrolls down 300px
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    // Use passive event listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { passive: true });
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Router>
      <GlobalStyle />
      <BackgroundEffect />
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      <Footer />
      
      <AnimatePresence>
        {showScrollTop && (
          <ScrollTopButton
            as={motion.button}
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            aria-label="Scroll to top"
          >
            <FiArrowUp size={20} />
          </ScrollTopButton>
        )}
      </AnimatePresence>
    </Router>
  );
}

// Loading fallback component for lazy-loaded routes
const LoadingFallback = () => (
  <LoadingContainer>
    <LoadingSpinner />
  </LoadingContainer>
);

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(100, 255, 218, 0.3);
  border-radius: 50%;
  border-top-color: #64ffda;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ScrollTopButton = styled.button`
  position: fixed;
  bottom: 15px;
  right: 15px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #64ffda;
  color: #0a192f;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: none;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 999;
  transition: all 0.3s ease;
  will-change: transform; /* Optimize for animations */
  
  &:hover {
    transform: translateY(-5px);
    background-color: #a8ffe0;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    bottom: 10px;
    right: 10px;
  }
`;

export default App;
