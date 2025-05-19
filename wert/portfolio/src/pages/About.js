import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiCode, FiDatabase, FiLayout, FiServer, FiBriefcase, FiBook, FiAward } from 'react-icons/fi';

const About = () => {
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

  const skills = [
    { name: 'HTML/CSS', level: 90 },
    { name: 'JavaScript', level: 85 },
    { name: 'React', level: 80 },
    { name: 'Python', level: 90 },
    { name: 'Flask', level: 75 },
    { name: 'UI/UX Design', level: 70 },
  ];

  const services = [
    {
      icon: <FiCode />,
      title: 'Web Development',
      description: 'Creating responsive and interactive web applications using modern technologies.',
    },
    {
      icon: <FiLayout />,
      title: 'UI/UX Design',
      description: 'Designing intuitive and visually appealing user interfaces for better user experience.',
    },
    {
      icon: <FiServer />,
      title: 'Desktop Applications',
      description: 'Building efficient and secure desktop applications for various platforms.',
    },
    {
      icon: <FiDatabase />,
      title: 'Data Security',
      description: 'Implementing encryption and security measures to protect sensitive data.',
    },
  ];
  
  const timeline = [
    {
      year: '2024 - Present',
      title: 'Computer Science Degree— ready for what’s next.',
      description: 'Studying advanced programming concepts, algorithms, and software development methodologies.',
      icon: <FiBook />,
      category: 'work'
    },
    {
      year: '2022 - 2023',
      title: 'Hands-on industry experience — and the journey continues.',
      description: 'I worked in the industry, where I developed problem-solving skills and gained a solid understanding of both machines and software.',
      icon: <FiBriefcase />,
      category: 'education'
    },
    {
      year: '2019 - 2022',
      title: 'Diploma done — this is just the beginning of what’s next.',
      description: 'With a diploma in DTDM and a strong base in practical skills, I’ve now started my journey into software — learning, building, and exploring new technologies.',
      icon: <FiBook />,
      category: 'work'
    },
    {
      year: '2019',
      title: 'Started my journey — this is where it begins.',
      description: 'Every journey starts somewhere — I began mine by truly learning, coding, creating, and exploring new technologies.',
      icon: <FiAward />,
      category: 'education'
    },
  ];

  return (
    <AboutContainer>
      <Container>
        <PageHeader>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            About Me
          </motion.h1>
          <motion.div
            className="underline"
            initial={{ width: 0 }}
            animate={{ width: '100px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </PageHeader>

        <AboutSection>
          <AboutContent>
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h2>Who I Am</h2>
              <p>
                I'm Rolan, an aspiring software engineer and freelancer from Yellapur, India. 
                I'm passionate about creating innovative, functional, and visually appealing 
                digital solutions that solve real-world problems.
              </p>
              <p>
                With a focus on both web and desktop application development, I enjoy the 
                process of turning ideas into reality through clean code and thoughtful design. 
                I'm particularly interested in security applications and file management systems.
              </p>
              <p>
                When I'm not coding, I'm continuously expanding my skills and knowledge in 
                the ever-evolving tech landscape, always looking for new challenges and 
                opportunities to grow as a developer.
              </p>
            </motion.div>
          </AboutContent>
          <AboutImage>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img src="/images/Contact.jpg" alt="Rolan" />
            </motion.div>
          </AboutImage>
        </AboutSection>

        <TimelineSection>
          <SectionTitle>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              My Journey
            </motion.h2>
          </SectionTitle>
          <TimelineContainer>
            {timeline.map((item, index) => (
              <TimelineItem 
                key={index}
                as={motion.div}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                isLeft={index % 2 === 0}
                category={item.category}
              >
                <TimelineContent isLeft={index % 2 === 0}>
                  <TimelineYear>{item.year}</TimelineYear>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </TimelineContent>
                <TimelineDot>
                  {item.icon}
                </TimelineDot>
              </TimelineItem>
            ))}
            <TimelineLine />
          </TimelineContainer>
        </TimelineSection>

        <SkillsSection>
          <SectionTitle>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              My Skills
            </motion.h2>
          </SectionTitle>
          <SkillsGrid>
            {skills.map((skill, index) => (
              <SkillItem
                key={index}
                as={motion.div}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                index={index}
              >
                <SkillInfo>
                  <h3>{skill.name}</h3>
                  <span>{skill.level}%</span>
                </SkillInfo>
                <SkillBar>
                  <SkillProgress 
                    as={motion.div}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  />
                </SkillBar>
              </SkillItem>
            ))}
          </SkillsGrid>
        </SkillsSection>

        <ServicesSection>
          <SectionTitle>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Services I Offer
            </motion.h2>
          </SectionTitle>
          <ServicesGrid>
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ServiceIcon>{service.icon}</ServiceIcon>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </ServiceCard>
            ))}
          </ServicesGrid>
        </ServicesSection>
      </Container>
    </AboutContainer>
  );
};

const AboutContainer = styled.div`
  padding: 120px 0 60px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Container = styled.div`
  max-width: 1400px;
  width: 95%;
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
    background: radial-gradient(circle at 80% 20%, rgba(10, 25, 47, 0.5) 0%, rgba(10, 25, 47, 0.8) 70%);
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
  }
  
  .underline {
    height: 4px;
    background-color: #64ffda;
    margin: 0 auto;
  }
`;

const AboutSection = styled.section`
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 50px;
  margin-bottom: 100px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 50%;
    width: 1px;
    height: 100%;
    background: linear-gradient(to bottom, transparent, rgba(100, 255, 218, 0.3), transparent);
    display: none;
    
    @media (min-width: 769px) {
      display: block;
    }
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AboutContent = styled.div`
  h2 {
    color: #ccd6f6;
    margin-bottom: 20px;
    font-size: 28px;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 50px;
      height: 2px;
      background: #64ffda;
    }
  }
  
  p {
    color: #8892b0;
    margin-bottom: 20px;
    font-size: 16px;
    line-height: 1.7;
    position: relative;
    padding-left: 15px;
    border-left: 2px solid rgba(100, 255, 218, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      border-left-color: #64ffda;
      transform: translateX(5px);
    }
  }
`;

const AboutImage = styled.div`
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 20px;
    width: 100%;
    height: 100%;
    border: 2px solid #64ffda;
    border-radius: 10px;
    z-index: -1;
    transition: all 0.3s ease;
  }
  
  &:hover::before {
    top: 10px;
    left: 10px;
  }
  
  img {
    width: 100%;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
    filter: grayscale(20%);
    transition: all 0.3s ease;
    
    &:hover {
      filter: grayscale(0%);
      transform: scale(1.02);
    }
  }
  
  @media (max-width: 768px) {
    text-align: center;
    
    img {
      max-width: 300px;
    }
  }
`;

const SectionTitle = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    color: #ccd6f6;
    display: inline-block;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 70px;
      height: 2px;
      background-color: #64ffda;
    }
  }
`;

const SkillsSection = styled.section`
  margin-bottom: 100px;
  background: rgba(17, 34, 64, 0.5);
  padding: 40px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  border: 1px solid rgba(100, 255, 218, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 20px 30px -15px rgba(2, 12, 27, 0.7);
    border-color: rgba(100, 255, 218, 0.2);
  }
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SkillItem = styled.div`
  margin-bottom: 30px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  &::before {
    content: '${props => props.index + 1}';
    position: absolute;
    left: -30px;
    top: 0;
    width: 24px;
    height: 24px;
    background: rgba(100, 255, 218, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #64ffda;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const SkillInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  
  h3 {
    color: #ccd6f6;
    font-size: 16px;
    font-weight: 500;
    position: relative;
    display: inline-block;
    transition: all 0.3s ease;
    
    &::before {
      content: '⚡';
      margin-right: 8px;
      color: #64ffda;
      opacity: 0;
      transform: translateX(-10px);
      transition: all 0.3s ease;
    }
  }
  
  span {
    color: #64ffda;
    font-size: 14px;
    font-weight: bold;
    background: rgba(100, 255, 218, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
  }
  
  &:hover h3::before {
    opacity: 1;
    transform: translateX(0);
  }
`;

const SkillBar = styled.div`
  height: 10px;
  background-color: #112240;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent 75%, rgba(255, 255, 255, 0.1) 80%, transparent 85%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkillProgress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #64ffda, #4cdbbd);
  border-radius: 10px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0.2) 20%, 
      rgba(255, 255, 255, 0.1) 40%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }
  
  @keyframes shimmer {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

const ServicesSection = styled.section`
  margin-bottom: 100px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 40px;
    background: linear-gradient(to bottom, transparent, #64ffda);
  }
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
`;

const ServiceCard = styled.div`
  background-color: rgba(17, 34, 64, 0.7);
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 0;
    background: #64ffda;
    transition: height 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 30px -15px rgba(2, 12, 27, 0.7);
    border-color: rgba(100, 255, 218, 0.3);
  }
  
  &:hover::before {
    height: 100%;
  }
  
  h3 {
    color: #ccd6f6;
    margin: 20px 0 15px;
    font-size: 20px;
    transition: all 0.3s ease;
  }
  
  p {
    color: #8892b0;
    font-size: 15px;
    line-height: 1.6;
    transition: all 0.3s ease;
  }
  
  &:hover h3 {
    transform: translateX(10px);
    color: #64ffda;
  }
  
  &:hover p {
    transform: translateX(5px);
  }
`;

const ServiceIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(100, 255, 218, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #64ffda;
  margin: 0 auto 15px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(100, 255, 218, 0.2);
    transform: scale(0);
    transition: transform 0.3s ease;
    z-index: -1;
  }
  
  svg {
    transition: all 0.3s ease;
  }
  
  ${ServiceCard}:hover & {
    transform: scale(1.1);
  }
  
  ${ServiceCard}:hover &::before {
    transform: scale(1.5);
    opacity: 0;
  }
  
  ${ServiceCard}:hover svg {
    transform: rotate(10deg) scale(1.2);
  }
`;

const TimelineSection = styled.section`
  margin-bottom: 100px;
  position: relative;
`;

const TimelineContainer = styled.div`
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 0;
`;

const TimelineLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #64ffda, transparent);
  transform: translateX(-50%);
  
  @media (max-width: 768px) {
    left: 30px;
  }
`;

const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 50px;
  display: flex;
  justify-content: ${({ isLeft }) => isLeft ? 'flex-start' : 'flex-end'};
  width: 100%;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  @media (max-width: 768px) {
    justify-content: flex-start;
    padding-left: 60px;
  }
`;

const TimelineContent = styled.div`
  width: 45%;
  padding: 25px;
  background-color: rgba(17, 34, 64, 0.7);
  border-radius: 10px;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    width: 20px;
    height: 2px;
    background: #64ffda;
    ${({ isLeft }) => isLeft ? 'right: -20px;' : 'left: -20px;'}
  }
  
  &:hover {
    border-color: rgba(100, 255, 218, 0.3);
    box-shadow: 0 20px 30px -15px rgba(2, 12, 27, 0.7);
  }
  
  h3 {
    color: #ccd6f6;
    margin-bottom: 10px;
    font-size: 18px;
    transition: all 0.3s ease;
  }
  
  p {
    color: #8892b0;
    font-size: 14px;
    line-height: 1.6;
  }
  
  &:hover h3 {
    color: #64ffda;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    
    &::before {
      left: -40px;
      width: 30px;
    }
  }
`;

const TimelineYear = styled.div`
  display: inline-block;
  padding: 5px 10px;
  background-color: rgba(100, 255, 218, 0.1);
  color: #64ffda;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  
  ${TimelineContent}:hover & {
    background-color: rgba(100, 255, 218, 0.2);
    transform: translateX(5px);
  }
`;

const TimelineDot = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(17, 34, 64, 0.9);
  border: 2px solid #64ffda;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64ffda;
  font-size: 16px;
  transform: translateX(-50%);
  z-index: 2;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(100, 255, 218, 0.2);
    transform: translateX(-50%) scale(1.2);
  }
  
  @media (max-width: 768px) {
    left: 30px;
    transform: translateX(-50%);
    
    &:hover {
      transform: translateX(-50%) scale(1.2);
    }
  }
`;

export default About;