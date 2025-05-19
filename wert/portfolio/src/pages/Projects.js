import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiExternalLink, FiFolder, FiX, FiSearch, FiDownload } from 'react-icons/fi';

const Projects = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get file type label
  const getFileTypeLabel = (fileType) => {
    switch(fileType) {
      case 'exe':
        return 'Windows Executable';
      case 'apk':
        return 'Android Package';
      default:
        return 'Download';
    }
  };

  const projectsData = [
    {
      id: 1,
      title: 'InvisioVault-Desktop',
      description: 'Desktop app that hides files (PDFs, media, etc.) inside images using AES-256 encryption. Supports PNG, JPG, BMP formats and offers batch processing with a clean, user-friendly interface.',
      image: '/images/InvisioVault.webp',
      tech: ['Python', 'AES-256', 'Steganography', 'UI/UX'],
      github: 'https://github.com/Mrtracker-new/InvisioVault-Desktop',
      category: 'desktop',
      featured: true,
      downloadLink: 'https://github.com/Mrtracker-new/InvisioVault-Desktop/releases/download/v1.0.0/InvisioVault.exe',
      fileType: 'exe',
      longDescription: 'InvisioVault is a powerful desktop application designed for secure file hiding using advanced steganography techniques. It allows users to conceal sensitive documents, PDFs, and media files within ordinary images using AES-256 encryption. The application supports multiple image formats including PNG, JPG, and BMP, and features an intuitive batch processing system for handling multiple files simultaneously. With its clean, user-friendly interface, InvisioVault makes complex security operations accessible to everyone while maintaining enterprise-grade protection standards.',
    },
    {
      id: 2,
      title: 'BAR (Burn After Reading)',
      description: 'Secure, offline desktop app for managing sensitive files. Scans for and handles .bar files across devices, with no server dependencies to ensure data stays private.',
      image: '/images/BAR_logo.png',
      tech: ['Python', 'Security', 'File Management', 'Encryption'],
      github: 'https://github.com/Mrtracker-new/BAR',
      category: 'desktop',
      featured: true,
      downloadLink: 'https://github.com/Mrtracker-new/BAR/releases/download/v1.0/BAR.exe',
      fileType: 'exe',
      longDescription: 'BAR (Burn After Reading) is a secure, offline desktop application designed specifically for handling sensitive files. The application operates completely offline with no server dependencies, ensuring that your data remains private and secure. BAR scans for and manages .bar files across devices, providing a reliable solution for sensitive file management. With its focus on privacy and security, BAR is the perfect tool for anyone who needs to handle confidential information without compromising on security or ease of use.',
    },
    {
      id: 3,
      title: 'Sortify',
      description: 'Smart File Organizer that automatically organizes files into categorized folders based on their formats. Easily sort documents, images, videos, and more with a single click.',
      image: '/images/Sortify.jpeg',
      tech: ['Python', 'Automation', 'File Organization'],
      github: 'https://github.com/Mrtracker-new/Sortify',
      category: 'desktop',
      featured: true,
      downloadLink: 'https://github.com/Mrtracker-new/Sortify/releases',
      fileType: 'exe',
      longDescription: 'Sortify is an intelligent file organization tool that brings order to digital chaos. This smart application automatically categorizes and organizes files into appropriate folders based on their formats, making file management effortless. With Sortify, users can instantly sort documents, images, videos, audio files, and more with just a single click. The application features customizable sorting rules, batch processing capabilities, and an intuitive interface that makes complex file organization tasks simple and efficient. Sortify is perfect for professionals, students, or anyone looking to maintain a clean, organized digital workspace.',
    },
    {
      id: 4,
      title: 'RNR Contact Manager',
      description: 'Modern contact management application that allows users to store contacts with rich profiles including photos, documents, tags, and group categorization.',
      image: '/images/RNR Contact.jpeg',
      tech: ['JavaScript', 'React', 'Contact Management'],
      github: 'https://github.com/Mrtracker-new/Contact-manager',
      category: 'web',
      featured: true,
      downloadLink: 'https://github.com/Mrtracker-new/Contact-manager/releases/download/v1.0/Contact-Manager.apk',
      fileType: 'apk',
      website: 'https://rnr-contact-manager.netlify.app',
      longDescription: 'RNR Contact Manager is a comprehensive contact management solution designed for the modern professional. This web application enables users to create and maintain detailed contact profiles that go beyond basic information. Users can attach photos, documents, custom tags, and organize contacts into customizable groups. The application features advanced search and filtering capabilities, contact sharing options, and seamless integration with other productivity tools. With its responsive design and intuitive interface, RNR Contact Manager provides an efficient way to manage professional and personal relationships across devices.',
    },
    {
      id: 5,
      title: 'InvisioVault',
      description: 'Flask-based web application for file steganography, where users can hide a file within an image or extract a hidden file from an image.',
      image: '/images/InvisioVault_web.jpg',
      tech: ['HTML', 'Flask', 'Steganography'],
      github: 'https://github.com/Mrtracker-new/InvisioVault',
      category: 'web',
      featured: false,
      website: 'https://invisio-vault.vercel.app/',
      longDescription: 'The File Steganography Web App is a Flask-based application that brings powerful steganography capabilities to the web. This tool allows users to securely hide any type of file within an image or extract previously hidden files from images. Built with a focus on security and ease of use, the application features a clean, intuitive interface that makes complex steganography operations accessible to users of all technical levels. The web app supports various image formats and implements secure encryption methods to ensure that hidden data remains protected. This project demonstrates the powerful combination of web technologies and security principles in creating practical privacy tools.',
    },
    {
      id: 6,
      title: 'Portfolio Website',
      description: 'Personal portfolio website built with React and styled-components featuring smooth animations and responsive design.',
      image: '/images/rnr.jpeg',
      tech: ['React', 'Styled Components', 'Framer Motion'],
      github: 'https://github.com/Mrtracker-new/RNR',
      category: 'web',
      featured: false,
      website: 'https://mrtracker-new.github.io/RNR/',
      longDescription: 'This portfolio website showcases my skills and projects using modern web development technologies. Built with React and styled-components, the site features smooth animations powered by Framer Motion, creating an engaging user experience. The responsive design ensures optimal viewing across all devices, from desktop to mobile. The portfolio includes detailed project showcases, an about section, and contact information, all presented in a clean, professional layout. The site demonstrates my approach to front-end development, combining aesthetic design with technical implementation to create compelling web experiences.',
    },
    {
      id: 7,
      title: 'YT-Downloader',
      description: 'A modern YouTube video/audio downloader web application with theme support, preview functionality, and download management.',
      image: '/images/YT.jpeg',
      tech: ['React', 'Styled Components', 'Framer Motion'],
      github: 'https://github.com/Mrtracker-new/YT-Downloader',
      category: 'web',
      featured: false,
      longDescription: 'A modern and user-friendly YouTube video and audio downloader web application featuring both dark and light themes, video preview functionality, and advanced download management with progress tracking, real-time speed monitoring, and resume/pause capabilities.',
    },
    {
      id: 8,
      title: 'CursorCam',
      description: 'CursorCam: Hands-Free Mouse Control CursorCam uses facial recognition to control the mouse via your laptop’s camera,',
      image: '/images/CursorCam.webp',
      tech: ['React', 'Styled Components', 'Framer Motion'],
      github: 'https://github.com/Mrtracker-new/CursorCam',
      category: 'web',
      featured: false,
      longDescription: 'CursorCam is a Flask-based web application that transforms your laptops camera into a mouse controller using facial recognition. By tracking facial movements, the application mimics mouse movements, allowing you to control your device hands-free. The system incorporates advanced calibration and user profiles for customization and accuracy.',
    },
  ];

  // Filter projects based on category and search term
  const filteredProjects = projectsData
    .filter(project => filter === 'all' || project.category === filter)
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tech.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Handle project click to open modal
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Close modal on escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto'; // Ensure scrolling is re-enabled when component unmounts
    };
  }, []);

  return (
    <ProjectsContainer>
      <Container>
        <PageHeader>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            My Projects
          </motion.h1>
          <motion.div
            className="underline"
            initial={{ width: 0 }}
            animate={{ width: '100px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </PageHeader>

        <SearchAndFilterContainer>
          <FilterContainer>
            <FilterButton 
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              as={motion.button}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              All
            </FilterButton>
            <FilterButton 
              active={filter === 'web'}
              onClick={() => setFilter('web')}
              as={motion.button}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              Web
            </FilterButton>
            <FilterButton 
              active={filter === 'desktop'}
              onClick={() => setFilter('desktop')}
              as={motion.button}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              Desktop
            </FilterButton>
          </FilterContainer>
          
          <SearchContainer>
            <SearchIcon>
              <FiSearch />
            </SearchIcon>
            <SearchInput 
              type="text" 
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
        </SearchAndFilterContainer>

        {filteredProjects.length === 0 ? (
          <NoResultsMessage>
            No projects found matching your criteria. Try adjusting your search or filter.
          </NoResultsMessage>
        ) : (
          <ProjectsGrid>
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  as={motion.div}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  featured={project.featured}
                  onClick={() => handleProjectClick(project)}
                >
                  <ProjectImageContainer>
                    <ProjectImage src={project.image} alt={project.title} />
                    <ProjectOverlay>
                      <ViewDetailsButton>View Details</ViewDetailsButton>
                    </ProjectOverlay>
                  </ProjectImageContainer>
                  
                  <ProjectContent>
                    <ProjectHeader>
                      <ProjectIcon>
                        <FiFolder size={30} />
                      </ProjectIcon>
                      <ProjectLinks>
                        <ProjectLink 
                          href={project.github} 
                          target="_blank"
                          rel="noopener noreferrer"
                          as={motion.a}
                          whileHover={{ y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                        >
                          <FiGithub size={20} />
                        </ProjectLink>
                        {project.website && (
                          <ProjectLink 
                            href={project.website} 
                            target="_blank"
                            rel="noopener noreferrer"
                            as={motion.a}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                          >
                            <FiExternalLink size={20} />
                          </ProjectLink>
                        )}
                        {project.downloadLink && (
                          <ProjectLink 
                            href={project.downloadLink} 
                            target="_blank"
                            rel="noopener noreferrer"
                            as={motion.a}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                            title={`Download ${getFileTypeLabel(project.fileType)}`}
                          >
                            <FiDownload size={20} />
                          </ProjectLink>
                        )}
                      </ProjectLinks>
                    </ProjectHeader>
                    <ProjectTitle>{project.title}</ProjectTitle>
                    <ProjectDescription>{project.description}</ProjectDescription>
                    <ProjectTechList>
                      {project.tech.map((tech, index) => (
                        <ProjectTechItem key={index}>{tech}</ProjectTechItem>
                      ))}
                    </ProjectTechList>
                  </ProjectContent>
                </ProjectCard>
              ))}
            </AnimatePresence>
          </ProjectsGrid>
        )}
        
        {/* Project Detail Modal */}
        <AnimatePresence>
          {isModalOpen && selectedProject && (
            <ModalOverlay
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <ModalContent
                as={motion.div}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <ModalCloseButton onClick={closeModal}>
                  <FiX size={24} />
                </ModalCloseButton>
                
                <ModalImageContainer>
                  <ModalImage src={selectedProject.image} alt={selectedProject.title} />
                </ModalImageContainer>
                
                <ModalBody>
                  <ModalTitle>{selectedProject.title}</ModalTitle>
                  
                  <ModalDescription>
                    {selectedProject.longDescription}
                  </ModalDescription>
                  
                  <ModalTechSection>
                    <ModalSectionTitle>Technologies Used</ModalSectionTitle>
                    <ModalTechList>
                      {selectedProject.tech.map((tech, index) => (
                        <ModalTechItem key={index}>{tech}</ModalTechItem>
                      ))}
                    </ModalTechList>
                  </ModalTechSection>
                  
                  <ModalLinks>
                    <ModalLink 
                      href={selectedProject.github} 
                      target="_blank"
                      rel="noopener noreferrer"
                      as={motion.a}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiGithub size={20} />
                      <span>View Code</span>
                    </ModalLink>
                    {selectedProject.demo && (
                      <ModalLink 
                        href={selectedProject.demo} 
                        target="_blank"
                        rel="noopener noreferrer"
                        as={motion.a}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiExternalLink size={20} />
                        <span>Live Demo</span>
                      </ModalLink>
                    )}
                    {selectedProject.downloadLink && (
                      <ModalLink 
                        href={selectedProject.downloadLink} 
                        target="_blank"
                        rel="noopener noreferrer"
                        as={motion.a}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className={selectedProject.fileType}
                      >
                        <FiDownload size={20} />
                        <span>Download {getFileTypeLabel(selectedProject.fileType)}</span>
                      </ModalLink>
                    )}
                  </ModalLinks>
                </ModalBody>
              </ModalContent>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </Container>
    </ProjectsContainer>
  );
};

const ProjectsContainer = styled.div`
  padding-top: 100px;
  padding-bottom: 100px;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
  width: 100%;
`;

const Container = styled.div`
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 30% 70%, rgba(10, 25, 47, 0.5) 0%, rgba(10, 25, 47, 0.8) 70%);
    z-index: -1;
    pointer-events: none;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
  
  h1 {
    color: #ccd6f6;
    margin-bottom: 20px;
    text-shadow: 0 2px 10px rgba(100, 255, 218, 0.3);
  }
  
  .underline {
    height: 4px;
    background: linear-gradient(to right, rgba(100, 255, 218, 0.5), #64ffda, rgba(100, 255, 218, 0.5));
    margin: 0 auto;
    border-radius: 2px;
    box-shadow: 0 2px 10px rgba(100, 255, 218, 0.3);
  }
`;

const SearchAndFilterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
  flex-wrap: wrap;
  gap: 20px;
  background-color: rgba(17, 34, 64, 0.6);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  box-shadow: 0 5px 15px -5px rgba(2, 12, 27, 0.5);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const FilterButton = styled.button`
  background-color: ${({ active }) => active ? 'rgba(100, 255, 218, 0.2)' : 'rgba(10, 25, 47, 0.5)'};
  color: ${({ active }) => active ? '#64ffda' : '#8892b0'};
  border: 1px solid ${({ active }) => active ? '#64ffda' : '#8892b0'};
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    color: #64ffda;
    border-color: #64ffda;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 300px;
  transition: all 0.3s ease;
  
  &:focus-within {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8892b0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 40px;
  background-color: rgba(10, 25, 47, 0.7);
  border: 1px solid #8892b0;
  border-radius: 4px;
  color: #ccd6f6;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:focus {
    outline: none;
    border-color: #64ffda;
    box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.2);
    background-color: rgba(10, 25, 47, 0.9);
  }
  
  &::placeholder {
    color: #8892b0;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #8892b0;
  font-size: 18px;
  margin: 50px 0;
  padding: 30px;
  background-color: rgba(10, 25, 47, 0.5);
  border-radius: 8px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.5);
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  perspective: 1000px; /* Adds depth to the grid */
  
  & > div {
    transform-style: preserve-3d;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.div`
  background-color: rgba(17, 34, 64, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  grid-column: ${({ featured }) => featured ? 'span 2' : 'span 1'};
  cursor: pointer;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  
  @media (max-width: 1100px) {
    grid-column: span 1;
  }
  
  &:hover {
    box-shadow: 0 20px 30px -15px rgba(2, 12, 27, 0.7);
    transform: translateY(-10px);
    border-color: rgba(100, 255, 218, 0.3);
  }
  
  ${({ featured }) => featured && `
    border: 1px solid rgba(100, 255, 218, 0.3);
    background-color: rgba(17, 34, 64, 0.9);
  `}
`;

const ProjectImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  height: 200px;
`;

const ProjectImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
`;

const ProjectOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 25, 47, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ProjectImageContainer}:hover & {
    opacity: 1;
  }
  
  ${ProjectImageContainer}:hover ${ProjectImage} {
    transform: scale(1.1);
  }
`;

const ViewDetailsButton = styled.button`
  background-color: transparent;
  color: #64ffda;
  border: 1px solid #64ffda;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(100, 255, 218, 0.1);
  }
`;

const ProjectContent = styled.div`
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ProjectIcon = styled.div`
  color: #64ffda;
`;

const ProjectLinks = styled.div`
  display: flex;
  gap: 15px;
`;

const ProjectLink = styled.a`
  color: #a8b2d1;
  transition: all 0.3s ease;
  
  &:hover {
    color: #64ffda;
  }
`;

const ProjectTitle = styled.h3`
  color: #e6f1ff;
  font-size: 22px;
  margin-bottom: 10px;
`;

const ProjectDescription = styled.p`
  color: #a8b2d1;
  font-size: 16px;
  margin-bottom: 20px;
  flex: 1;
`;

const ProjectTechList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
`;

const ProjectTechItem = styled.li`
  color: #64ffda;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  
  &:not(:last-child)::after {
    content: '•';
    margin-left: 10px;
    color: #64ffda;
  }
`;

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 25, 47, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background-color: rgba(17, 34, 64, 0.95);
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 255, 218, 0.2);
  
  @media (max-width: 768px) {
    max-height: 80vh;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #8892b0;
  cursor: pointer;
  z-index: 10;
  transition: color 0.3s ease;
  
  &:hover {
    color: #64ffda;
  }
`;

const ModalImageContainer = styled.div`
  width: 100%;
  height: 300px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    height: 200px;
  }
`;

const ModalImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ModalBody = styled.div`
  padding: 30px;
`;

const ModalTitle = styled.h2`
  color: #e6f1ff;
  font-size: 28px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ModalDescription = styled.p`
  color: #a8b2d1;
  font-size: 16px;
  line-height: 1.7;
  margin-bottom: 30px;
`;

const ModalTechSection = styled.div`
  margin-bottom: 30px;
`;

const ModalSectionTitle = styled.h3`
  color: #ccd6f6;
  font-size: 20px;
  margin-bottom: 15px;
`;

const ModalTechList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ModalTechItem = styled.li`
  color: #64ffda;
  background-color: rgba(100, 255, 218, 0.1);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'SF Mono', 'Fira Code', monospace;
`;

const ModalLinks = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const ModalLink = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64ffda;
  background-color: rgba(100, 255, 218, 0.1);
  border: 1px solid #64ffda;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(100, 255, 218, 0.2);
  }
`;

export default Projects;