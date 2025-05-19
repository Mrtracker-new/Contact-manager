import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const BackgroundEffect = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile for reduced animations
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    
    return () => {
      window.removeEventListener('resize', checkMobile, { passive: true });
    };
  }, []);
  
  return (
    <BackgroundContainer>
      <GradientOverlay />
      <BackgroundPattern />
      <GlowingOrbs isMobile={isMobile}>
        <Orb className="orb-1" isMobile={isMobile} />
        <Orb className="orb-2" isMobile={isMobile} />
        <Orb className="orb-3" isMobile={isMobile} />
      </GlowingOrbs>
    </BackgroundContainer>
  );
};

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
`;

const GradientOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a192f 0%, #0d2240 50%, #102a4c 100%);
  opacity: 0.8;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(rgba(100, 255, 218, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.2;
`;

const GlowingOrbs = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: ${props => props.isMobile ? '0.2' : '0.4'}; /* Reduce opacity on mobile for better performance */
  will-change: opacity; /* Optimize for animations */
`;

const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: ${props => props.isMobile ? 'blur(40px)' : 'blur(60px)'}; /* Reduce blur on mobile */
  opacity: 0.3;
  animation: ${props => props.isMobile ? 'float 20s' : 'float 15s'} infinite ease-in-out; /* Slower animation on mobile */
  will-change: transform; /* Optimize for animations */
  
  &.orb-1 {
    top: 20%;
    left: 10%;
    width: ${props => props.isMobile ? '200px' : '300px'}; /* Smaller on mobile */
    height: ${props => props.isMobile ? '200px' : '300px'};
    background: rgba(100, 255, 218, 0.3);
    animation-delay: 0s;
  }
  
  &.orb-2 {
    bottom: 10%;
    right: 15%;
    width: ${props => props.isMobile ? '250px' : '400px'}; /* Smaller on mobile */
    height: ${props => props.isMobile ? '250px' : '400px'};
    background: rgba(100, 200, 255, 0.2);
    animation-delay: -5s;
  }
  
  &.orb-3 {
    top: 50%;
    right: 30%;
    width: ${props => props.isMobile ? '150px' : '200px'}; /* Smaller on mobile */
    height: ${props => props.isMobile ? '150px' : '200px'};
    background: rgba(149, 100, 255, 0.2);
    animation-delay: -10s;
  }
  
  @keyframes float {
    0% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(${props => props.isMobile ? '15px' : '30px'}, ${props => props.isMobile ? '10px' : '20px'}) scale(${props => props.isMobile ? '1.03' : '1.05'}); /* Smaller movement on mobile */
    }
    100% {
      transform: translate(0, 0) scale(1);
    }
  }
`;

export default BackgroundEffect;