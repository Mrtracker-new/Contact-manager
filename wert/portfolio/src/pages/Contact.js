import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const mailtoLink = `mailto:rolanlobo901@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;    
    
    // Open mail client
    window.location.href = mailtoLink;
    
    // Show success message
    setFormStatus({
      submitted: true,
      success: true,
      message: 'Opening your mail app. If it doesn\'t open automatically, please email me directly at rolanlobo901@gmail.com',
    });

    // Reset form after submission
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });

    // Reset form status after 5 seconds
    setTimeout(() => {
      setFormStatus({
        submitted: false,
        success: false,
        message: '',
      });
    }, 5000);
  };

  const contactInfo = [
    {
      icon: <FiMail />,
      title: 'Email',
      content: 'rolanlobo901@gmail.com',
      link: 'mailto:rolanlobo901@gmail.com',
    },
    {
      icon: <FiPhone />,
      title: 'Phone',
      content: '+91 9353919323',
      link: 'tel:+919353919323',
    },
    {
      icon: <FiMapPin />,
      title: 'Location',
      content: 'Yellapur, India',
      link: 'https://maps.google.com/?q=Yellapur,India',
    },
  ];

  return (
    <ContactContainer>
      <Container>
        <PageHeader>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Get In Touch
          </motion.h1>
          <motion.div
            className="underline"
            initial={{ width: 0 }}
            animate={{ width: '100px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </PageHeader>

        <ContactSection>
          <ContactInfo>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Contact Information
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Feel free to reach out to me for any questions or opportunities. I'll get back to you as soon as possible.
            </motion.p>

            <ContactInfoItems>
              {contactInfo.map((info, index) => (
                <ContactInfoItem
                  key={index}
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <ContactInfoIcon>{info.icon}</ContactInfoIcon>
                  <ContactInfoContent>
                    <h3>{info.title}</h3>
                    <a href={info.link} target="_blank" rel="noopener noreferrer">
                      {info.content}
                    </a>
                  </ContactInfoContent>
                </ContactInfoItem>
              ))}
            </ContactInfoItems>

            <ContactImage>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="map-container"
              >
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30933.00012355155!2d74.69999!3d14.96444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbe5f9550d9c0c9%3A0x7e66b9e82c9b5991!2sYellapur%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1651234567890!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, borderRadius: '10px' }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Yellapur, India Map"
                ></iframe>
              </motion.div>
            </ContactImage>
          </ContactInfo>

          <ContactForm>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Send Me a Message
            </motion.h2>

            {formStatus.submitted && (
              <FormMessage success={formStatus.success}>
                {formStatus.message}
              </FormMessage>
            )}

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FormGroup>
                <FormLabel>Your Name</FormLabel>
                <FormInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Email Address</FormLabel>
                <FormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Subject</FormLabel>
                <FormInput
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Message</FormLabel>
                <FormTextarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  required
                />
              </FormGroup>

              <SubmitButton
                type="submit"
                as={motion.button}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                Send Message <FiSend />
              </SubmitButton>
            </motion.form>
          </ContactForm>
        </ContactSection>
      </Container>
    </ContactContainer>
  );
};

const ContactContainer = styled.div`
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
    background: radial-gradient(circle at 70% 50%, rgba(10, 25, 47, 0.5) 0%, rgba(10, 25, 47, 0.8) 70%);
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

const ContactSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContactInfo = styled.div`
  h2 {
    color: #ccd6f6;
    margin-bottom: 20px;
    font-size: 28px;
  }
  
  p {
    color: #8892b0;
    margin-bottom: 30px;
    font-size: 16px;
    line-height: 1.7;
  }
`;

const ContactInfoItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
`;

const ContactInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ContactInfoIcon = styled.div`
  width: 50px;
  height: 50px;
  background-color: rgba(100, 255, 218, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64ffda;
  font-size: 20px;
`;

const ContactInfoContent = styled.div`
  h3 {
    color: #ccd6f6;
    font-size: 18px;
    margin-bottom: 5px;
  }
  
  a {
    color: #8892b0;
    font-size: 16px;
    transition: all 0.3s ease;
    
    &:hover {
      color: #64ffda;
    }
  }
`;

const ContactImage = styled.div`
  margin-top: 30px;
  
  img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  }
`;

const ContactForm = styled.div`
  background-color: #112240;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  
  h2 {
    color: #ccd6f6;
    margin-bottom: 30px;
    font-size: 28px;
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  color: #ccd6f6;
  font-size: 14px;
`;

const FormInput = styled.input`
  background-color: #0a192f;
  border: 1px solid #1e3a8a;
  border-radius: 4px;
  padding: 12px 15px;
  color: #e6f1ff;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #64ffda;
    outline: none;
  }
`;

const FormTextarea = styled.textarea`
  background-color: #0a192f;
  border: 1px solid #1e3a8a;
  border-radius: 4px;
  padding: 12px 15px;
  color: #e6f1ff;
  font-size: 16px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #64ffda;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  background-color: transparent;
  color: #64ffda;
  border: 1px solid #64ffda;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  
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
`;

const FormMessage = styled.div`
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: ${({ success }) => success ? 'rgba(100, 255, 218, 0.1)' : 'rgba(255, 100, 100, 0.1)'};
  color: ${({ success }) => success ? '#64ffda' : '#ff6464'};
  border: 1px solid ${({ success }) => success ? '#64ffda' : '#ff6464'};
`;

export default Contact;