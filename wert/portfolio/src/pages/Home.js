import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCode, FiDatabase, FiLayout, FiServer, FiStar, FiUser, FiMail } from 'react-icons/fi';

const Home = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };

  const projectData = [
    {
      id: 1,
      title: 'InvisioVault',
      description: 'Desktop app that hides files inside images using AES-256 encryption. Supports PNG, JPG, BMP formats with batch processing.',
      image: '/images/InvisioVault.webp',
      tech: ['Python', 'AES-256', 'Steganography'],
    },
    {
      id: 2,
      title: 'BAR (Burn After Reading)',
      description: 'Secure, offline desktop app for managing sensitive files. Scans for and handles .bar files across devices with no server dependencies.',
      image: '/images/BAR_logo.png',
      tech: ['Python', 'Security', 'File Management'],
    },
    {
      id: 3,
      title: 'Sortify',
      description: 'Smart File Organizer that automatically organizes files into categorized folders based on their formats.',
      image: '/images/Sortify.jpeg',
      tech: ['Python', 'Automation', 'File Organization'],
    },
  ];

  const skills = [
    { name: 'Web Development', icon: <FiCode />, level: 90 },
    { name: 'Database Design', icon: <FiDatabase />, level: 85 },
    { name: 'UI/UX Design', icon: <FiLayout />, level: 80 },
    { name: 'Backend Systems', icon: <FiServer />, level: 85 },
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Project Manager',
      image: '/images/testimonial-1.jpg',
      text: 'Rolan delivered an exceptional web application that exceeded our expectations. His attention to detail and problem-solving skills made our project a success.',
    },
    {
      id: 2,
      name: 'Sarah Williams',
      role: 'Startup Founder',
      image: '/images/testimonial-2.jpg',
      text: 'Working with Rolan was a pleasure. He understood our vision and transformed it into a beautiful, functional website that perfectly represents our brand.',
    },
    {
      id: 3,
      name: 'Michael Chen',
      role: 'Tech Lead',
      image: '/images/testimonial-3.jpg',
      text: 'Rolans technical expertise and creativity are impressive. He built a robust desktop application that streamlined our workflow and increased productivity.',
    },
  ];

  return (
    <HomeContainer>
      <HeroSection>
        <Container>
          <HeroContent>
            <HeroTextContent>
              <motion.p 
                className="intro"
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                Hi, my name is
              </motion.p>
              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <span className="name">Rolan.</span>
                <br />
                <span className="title">I build things for the web & desktop.</span>
              </motion.h1>
              <motion.p
                className="description"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                I'm an aspiring software engineer and freelancer from Yellapur, India. 
                I'm continuously expanding my skills and passion for creating innovative, 
                functional, and visually appealing digital solutions.
              </motion.p>
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <CTAButton to="/projects">
                  View My Work <FiArrowRight />
                </CTAButton>
              </motion.div>
            </HeroTextContent>
            <HeroImageContainer
              as={motion.div}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <HeroImage src="/images/profilernr.jpg" alt="Rolan" />
            </HeroImageContainer>
          </HeroContent>
        </Container>
      </HeroSection>

      <AboutSection>
        <Container>
          <SectionHeader>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              About Me
            </motion.h2>
          </SectionHeader>
          
          <AboutContent>
            <AboutImageContainer
              as={motion.div}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src="/images/aboutrnr.jpg" alt="About Rolan" />
            </AboutImageContainer>
            
            <AboutTextContent
              as={motion.div}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3>Who I Am</h3>
              <p>
                I'm a passionate software developer with a focus on creating elegant, efficient, and user-friendly applications. 
                With expertise in both web and desktop development, I enjoy tackling complex problems and turning ideas into reality.
              </p>
              <p>
                My journey in software development began with a curiosity about how things work, which evolved into a career 
                building applications that make a difference. I'm constantly learning and adapting to new technologies to deliver 
                the best possible solutions.
              </p>
              <AboutLink to="/about">
                Learn more about me <FiArrowRight />
              </AboutLink>
            </AboutTextContent>
          </AboutContent>
        </Container>
      </AboutSection>

      <SkillsSection>
        <Container>
          <SectionHeader>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              My Skills
            </motion.h2>
          </SectionHeader>
          
          <SkillsGrid>
            {skills.map((skill, index) => (
              <SkillCard
                key={index}
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, boxShadow: '0 10px 30px -10px rgba(2, 12, 27, 0.7)' }}
              >
                <SkillIconContainer>
                  {skill.icon}
                </SkillIconContainer>
                <h3>{skill.name}</h3>
                <SkillBar>
                  <SkillProgress width={skill.level} />
                </SkillBar>
                <SkillLevel>{skill.level}%</SkillLevel>
              </SkillCard>
            ))}
          </SkillsGrid>
        </Container>
      </SkillsSection>

      <ProjectsSection>
        <Container>
          <SectionHeader>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Featured Projects
            </motion.h2>
          </SectionHeader>
          
          <ProjectsGrid>
            {projectData.map((project, index) => (
              <ProjectCard
                key={project.id}
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <ProjectImage>
                  <img src={project.image} alt={project.title} />
                </ProjectImage>
                <ProjectContent>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <TechList>
                    {project.tech.map((tech, i) => (
                      <TechItem key={i}>{tech}</TechItem>
                    ))}
                  </TechList>
                </ProjectContent>
              </ProjectCard>
            ))}
          </ProjectsGrid>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ textAlign: 'center', marginTop: '50px' }}
          >
            <ViewAllButton to="/projects">
              View All Projects <FiArrowRight />
            </ViewAllButton>
          </motion.div>
        </Container>
      </ProjectsSection>

      <TestimonialsSection>
        <Container>
          <SectionHeader>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              What People Say
            </motion.h2>
          </SectionHeader>
          
          <TestimonialsGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <QuoteIcon>
                  <FiStar />
                </QuoteIcon>
                <TestimonialText>"{testimonial.text}"</TestimonialText>
                <TestimonialAuthor>
                  <TestimonialImage>
                    <img src={testimonial.image} alt={testimonial.name} />
                  </TestimonialImage>
                  <TestimonialInfo>
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </TestimonialInfo>
                </TestimonialAuthor>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </Container>
      </TestimonialsSection>

      <ContactCTA>
        <Container>
          <ContactCTAContent
            as={motion.div}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Interested in working together?</h2>
            <p>Feel free to reach out if you're looking for a developer, have a question, or just want to connect.</p>
            <CTAButton to="/contact" className="contact-cta">
              Get In Touch <FiMail />
            </CTAButton>
          </ContactCTAContent>
        </Container>
      </ContactCTA>
    </HomeContainer>
  );
};

const HomeContainer = styled.div`
  overflow-x: hidden;
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 150px 0 100px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 20% 30%, rgba(10, 25, 47, 0.7) 0%, rgba(10, 25, 47, 0.9) 70%);
    z-index: -1;
  }

  @media (max-width: 768px) {
    padding: 120px 0 80px;
  }
`;

const HeroContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  
  @media (max-width: 992px) {
    flex-direction: column;
    text-align: center;
  }
`;

const HeroTextContent = styled.div`
  flex: 1;

  .intro {
    color: #64ffda;
    font-size: clamp(14px, 5vw, 16px);
    font-weight: 400;
    margin-bottom: 20px;
  }

  .name {
    color: #ccd6f6;
  }

  .title {
    color: #8892b0;
  }

  .description {
    color: #8892b0;
    font-size: clamp(16px, 5vw, 20px);
    max-width: 540px;
    margin-bottom: 30px;
    
    @media (max-width: 992px) {
      margin: 0 auto 30px;
    }
  }

  h1 {
    font-size: clamp(40px, 8vw, 80px);
    line-height: 1.1;
    margin-bottom: 20px;
  }
`;

const HeroImageContainer = styled.div`
  flex: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
  
  @media (max-width: 992px) {
    margin-top: 40px;
  }
`;

const HeroImage = styled.img`
  width: 300px;
  height: 300px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #64ffda;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  filter: grayscale(20%);
  transition: all 0.3s ease;
  
  &:hover {
    filter: grayscale(0%);
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    width: 250px;
    height: 250px;
  }
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background-color: transparent;
  color: #64ffda;
  border: 1px solid #64ffda;
  border-radius: 4px;
  padding: 15px 28px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(100, 255, 218, 0.1);
    transform: translateY(-3px);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(5px);
  }
  
  &.contact-cta {
    background-color: #64ffda;
    color: #0a192f;
    
    &:hover {
      background-color: rgba(100, 255, 218, 0.9);
    }
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;

  h2 {
    display: inline-block;
    color: #ccd6f6;
    position: relative;
    font-size: clamp(26px, 5vw, 32px);

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #64ffda;
    }
  }
`;

const AboutSection = styled.section`
  padding: 100px 0;
  background-color: #0a192f;

  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const AboutContent = styled.div`
  display: flex;
  align-items: center;
  gap: 50px;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const AboutImageContainer = styled.div`
  flex: 1;
  
  img {
    width: 100%;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  }
  
  @media (max-width: 992px) {
    display: flex;
    justify-content: center;
    
    img {
      max-width: 300px;
    }
  }
`;

const AboutTextContent = styled.div`
  flex: 1;
  color: #8892b0;
  
  h3 {
    color: #ccd6f6;
    font-size: 28px;
    margin-bottom: 20px;
  }
  
  p {
    margin-bottom: 20px;
    font-size: 18px;
    line-height: 1.6;
  }
  
  @media (max-width: 992px) {
    text-align: center;
  }
`;

const AboutLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #64ffda;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    color: #64ffda;
    transform: translateX(5px);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(5px);
  }
`;

const SkillsSection = styled.section`
  padding: 100px 0;
  background-color: #112240;

  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SkillCard = styled.div`
  background-color: #0a192f;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  transition: all 0.3s ease;
  
  h3 {
    color: #ccd6f6;
    margin: 15px 0;
    font-size: 20px;
  }
`;

const SkillIconContainer = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(100, 255, 218, 0.1);
  border-radius: 50%;
  color: #64ffda;
  font-size: 28px;
`;

const SkillBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #233554;
  border-radius: 4px;
  margin: 15px 0 5px;
  overflow: hidden;
`;

const SkillProgress = styled.div`
  height: 100%;
  background-color: #64ffda;
  border-radius: 4px;
  width: ${props => props.width}%;
`;

const SkillLevel = styled.span`
  color: #64ffda;
  font-size: 14px;
  font-weight: 500;
`;

const ProjectsSection = styled.section`
  padding: 100px 0;
  background-color: #0a192f;

  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.div`
  background-color: #112240;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  transition: all 0.3s ease;
`;

const ProjectImage = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  ${ProjectCard}:hover & img {
    transform: scale(1.05);
  }
`;

const ProjectContent = styled.div`
  padding: 25px;

  h3 {
    color: #e6f1ff;
    font-size: 22px;
    margin-bottom: 10px;
  }

  p {
    color: #a8b2d1;
    font-size: 16px;
    margin-bottom: 20px;
  }
`;

const TechList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
`;

const TechItem = styled.li`
  color: #64ffda;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  white-space: nowrap;

  &:not(:last-child)::after {
    content: '•';
    margin-left: 10px;
    color: #64ffda;
  }
`;

const ViewAllButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #64ffda;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    color: #64ffda;
    transform: translateX(5px);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(5px);
  }
`;

const TestimonialsSection = styled.section`
  padding: 100px 0;
  background-color: #112240;

  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled.div`
  background-color: #0a192f;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  transition: all 0.3s ease;
  position: relative;
`;

const QuoteIcon = styled.div`
  color: #64ffda;
  font-size: 24px;
  margin-bottom: 20px;
`;

const TestimonialText = styled.p`
  color: #a8b2d1;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
  font-style: italic;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const TestimonialImage = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TestimonialInfo = styled.div`
  h4 {
    color: #e6f1ff;
    font-size: 18px;
    margin-bottom: 5px;
  }
  
  p {
    color: #64ffda;
    font-size: 14px;
  }
`;

const ContactCTA = styled.section`
  padding: 100px 0;
  background-color: #0a192f;
  
  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const ContactCTAContent = styled.div`
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
  
  h2 {
    color: #ccd6f6;
    font-size: clamp(26px, 5vw, 32px);
    margin-bottom: 20px;
  }
  
  p {
    color: #8892b0;
    font-size: 18px;
    margin-bottom: 30px;
  }
`;

export default Home;