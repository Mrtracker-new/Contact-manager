import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%; /* Prevent font scaling in landscape on iOS */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-size-adjust: 100%; /* Standard property for other browsers */
    height: 100%;
    width: 100%;
    touch-action: manipulation; /* Prevents delays on mobile devices */
  }

  body {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; /* System font fallbacks */
    background-color: #0a192f;
    color: #e6f1ff;
    overflow-x: hidden;
    transition: background-color 0.5s ease;
    position: relative;
    text-rendering: optimizeLegibility;
    min-height: 100%;
    width: 100%;
    -webkit-tap-highlight-color: transparent; /* Removes tap highlight on mobile */
    -webkit-overflow-scrolling: touch; /* Enables smooth scrolling on iOS */
    backface-visibility: hidden; /* Prevents flickering on some browsers during animations */
    -webkit-backface-visibility: hidden;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ul {
    list-style: none;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block; /* Prevent extra space below images */
    -webkit-user-drag: none; /* Prevent image dragging in Safari */
    user-select: none; /* Prevents image selection */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    object-fit: cover; /* Ensures images maintain aspect ratio */
    will-change: transform; /* Optimizes animations by using GPU */
    transform: translateZ(0); /* Forces GPU acceleration */
    -webkit-transform: translateZ(0);
  }

  /* Cross-browser scrollbar styling */
  /* Webkit browsers (Chrome, Safari, newer versions of Opera, etc) */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0a192f;
  }

  ::-webkit-scrollbar-thumb {
    background: #64ffda;
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #4cdbbd;
  }
  
  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #64ffda #0a192f;
  }
  
  /* Microsoft Edge and IE */
  @supports (-ms-overflow-style: none) {
    html {
      scrollbar-face-color: #64ffda;
      scrollbar-track-color: #0a192f;
      scrollbar-arrow-color: #0a192f;
      scrollbar-shadow-color: #0a192f;
    }
  }

  /* Performance optimizations */
  .page-transition {
    will-change: opacity, transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  /* Prevent FOIT (Flash of Invisible Text) */
  @font-face {
    font-display: swap;
  }

  /* Improve animation performance */
  @media screen and (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    -webkit-font-smoothing: antialiased;
  }

  h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    -webkit-font-smoothing: antialiased;
  }

  h3 {
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    -webkit-font-smoothing: antialiased;
  }

  p {
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  section {
    padding: 100px 0;
  }

  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .highlight {
    color: #64ffda;
  }

  .btn {
    display: inline-block;
    padding: 12px 24px;
    border: 1px solid #64ffda;
    border-radius: 4px;
    color: #64ffda;
    font-weight: 500;
    transition: all 0.3s ease;
    background-color: transparent;
  }

  .btn:hover {
    background-color: rgba(100, 255, 218, 0.1);
    transform: translateY(-3px);
    -webkit-transform: translateY(-3px);
  }
  
  /* Add focus styles for accessibility */
  a:focus, button:focus {
    outline: 2px dashed #64ffda;
    outline-offset: 3px;
  }
  
  /* Improve touch interactions */
  /* Improve readability on mobile */
  @media (max-width: 768px) {
    p {
      line-height: 1.8;
      font-size: 16px;
    }
    
    section {
      padding: 60px 0; /* Reduce section padding on mobile */
    }
    
    .container {
      width: 95%;
      padding: 0 10px;
    }
  }
  
    /* Add tap highlight color for mobile */
    a:active, button:active {
      -webkit-tap-highlight-color: rgba(100, 255, 218, 0.2);
    }
    
    /* Improve form elements spacing */
    input, textarea, select {
      font-size: 16px; /* Prevent zoom on focus in iOS */
      margin-bottom: 16px;
      padding: 12px;
    }
  }
  
  /* Prevent text size adjustment on orientation change */
  @media screen and (orientation: landscape) {
    html {
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
  }
`;

export default GlobalStyle;