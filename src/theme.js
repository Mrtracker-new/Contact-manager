import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#5667ff',
      light: '#8b94ff',
      dark: '#303dc9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff3d7f',
      light: '#ff77a9',
      dark: '#c30057',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
    },
    warning: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
    },
    info: {
      main: '#2196f3',
      light: '#6ec6ff',
      dark: '#0069c0',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.00833em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.3px',
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 2,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(86, 103, 255, 0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #5667ff 30%, #8b94ff 90%)',
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #ff3d7f 30%, #ff77a9 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '3px solid #ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(86, 103, 255, 0.15)',
            },
          },
        },
      },
    },
  },
});

export default theme;