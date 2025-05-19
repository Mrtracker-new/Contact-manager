import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin, FiMail, FiInstagram } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <SocialLinks>
        <SocialItem
          as={motion.a}
          href="https://github.com/Mrtracker-new"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiGithub size={20} />
        </SocialItem>
        <SocialItem
          as={motion.a}
          href="https://www.linkedin.com/in/rolan-lobo-93368a239/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLinkedin size={20} />
        </SocialItem>
        <SocialItem
          as={motion.a}
          href="mailto:contact@example.com"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiMail size={20} />
        </SocialItem>
        <SocialItem
          as={motion.a}
          href="https://www.instagram.com/rolan_r_n_r/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiInstagram size={20} />
        </SocialItem>
      </SocialLinks>
      <Copyright>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          © {currentYear} RNR. All Rights Reserved.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Built By <span className="highlight">Rolan</span> — Always learning, always building
        </motion.p>
      </Copyright>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  padding: 40px 0;
  background-color: #0a192f;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const SocialItem = styled.a`
  color: #8892b0;
  transition: all 0.3s ease;
  
  &:hover {
    color: #64ffda;
  }
`;

const Copyright = styled.div`
  text-align: center;
  color: #8892b0;
  font-size: 0.9rem;
  
  p {
    margin: 5px 0;
  }
`;

export default Footer;