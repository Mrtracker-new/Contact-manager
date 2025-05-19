import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiHome, FiUser, FiFolder, FiMail } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <NavContainer scrolled={scrolled}>
      <NavContent>
        <Logo to="/" 
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="highlight">R</span>NR
        </Logo>

        <DesktopMenu>
          {['Home', 'About', 'Projects', 'Contact'].map((item, index) => (
            <NavItem 
              key={item}
              as={motion.li}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <NavLink 
                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className={location.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`) ? 'active' : ''}
              >
                {item}
              </NavLink>
            </NavItem>
          ))}
        </DesktopMenu>

        <MobileMenuToggle onClick={toggleMenu}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </MobileMenuToggle>

        <AnimatePresence>
          {isOpen && (
            <>
              <MobileMenuOverlay 
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsOpen(false)}
              />
              <MobileMenu
                as={motion.div}
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <MobileMenuHeader>
                  <Logo to="/" onClick={() => setIsOpen(false)}>
                    <span className="highlight">R</span>olan
                  </Logo>
                  <CloseButton onClick={toggleMenu}>
                    <FiX size={24} />
                  </CloseButton>
                </MobileMenuHeader>
                <MobileMenuItems>
                  {[
                    { name: 'Home', icon: <FiHome size={20} /> },
                    { name: 'About', icon: <FiUser size={20} /> },
                    { name: 'Projects', icon: <FiFolder size={20} /> },
                    { name: 'Contact', icon: <FiMail size={20} /> }
                  ].map((item, index) => (
                    <MobileNavItem 
                      key={item.name}
                      as={motion.li}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MobileNavLink 
                        to={item.name === 'Home' ? '/' : `/${item.name.toLowerCase()}`}
                        className={location.pathname === (item.name === 'Home' ? '/' : `/${item.name.toLowerCase()}`) ? 'active' : ''}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="icon">{item.icon}</span>
                        <span>{item.name}</span>
                      </MobileNavLink>
                    </MobileNavItem>
                  ))}
                </MobileMenuItems>
                <MobileMenuFooter>
                  <p>© {new Date().getFullYear()} Rolan</p>
                </MobileMenuFooter>
              </MobileMenu>
            </>
          )}
        </AnimatePresence>
      </NavContent>
    </NavContainer>
  );
};

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: ${({ scrolled }) => scrolled ? 'rgba(10, 25, 47, 0.95)' : 'rgba(10, 25, 47, 0.8)'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: ${({ scrolled }) => scrolled ? '0 10px 30px -10px rgba(2, 12, 27, 0.7)' : '0 5px 20px -10px rgba(2, 12, 27, 0.5)'};
  
  @media (max-width: 768px) {
    background-color: #0a192f;
    box-shadow: 0 10px 30px -10px rgba(2, 12, 27, 0.7);
    border-bottom: 2px solid rgba(100, 255, 218, 0.3);
  }
`;



const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #e6f1ff;
  display: flex;
  align-items: center;
`;

const DesktopMenu = styled.ul`
  display: flex;
  gap: 30px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled(Link)`
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 10px 15px;
  position: relative;
  color: #ccd6f6;
  border-radius: 4px;

  &:hover {
    color: #64ffda;
    background-color: rgba(100, 255, 218, 0.1);
  }

  &.active {
    color: #64ffda;
    background-color: rgba(100, 255, 218, 0.1);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: #64ffda;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover::after,
  &.active::after {
    width: 80%;
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  color: #64ffda;
  background: rgba(100, 255, 218, 0.1);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  z-index: 101;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(100, 255, 218, 0.2);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 25, 47, 0.7);
  backdrop-filter: blur(5px);
  z-index: 98;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 400px;
  height: 100vh;
  background-color: #0a192f;
  z-index: 110;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0px 30px -15px rgba(2, 12, 27, 0.7);
  padding: 0;
  overflow-y: auto;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(100, 255, 218, 0.1);
`;

const CloseButton = styled.button`
  color: #64ffda;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: rotate(90deg);
  }
`;

const MobileMenuItems = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 30px 20px;
  flex: 1;
`;

const MobileNavItem = styled.li`
  margin: 5px 0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const MobileNavLink = styled(Link)`
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  padding: 15px;
  transition: all 0.3s ease;
  border-radius: 8px;
  color: #ccd6f6;
  border-left: 3px solid transparent;
  
  .icon {
    margin-right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64ffda;
    opacity: 0.8;
    transition: all 0.3s ease;
  }

  &:hover {
    color: #64ffda;
    background-color: rgba(100, 255, 218, 0.1);
    border-left: 3px solid #64ffda;
    
    .icon {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  &.active {
    color: #64ffda;
    background-color: rgba(100, 255, 218, 0.15);
    border-left: 3px solid #64ffda;
    
    .icon {
      opacity: 1;
    }
  }
`;

const MobileMenuFooter = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 0.8rem;
  color: #8892b0;
  border-top: 1px solid rgba(100, 255, 218, 0.1);
`;

export default Navbar;