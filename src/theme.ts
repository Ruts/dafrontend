import { createTheme } from '@mui/material';

export const portalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#124e38', dark: '#0c3b29' },
    success: { main: '#124e38' },
    text: { primary: '#193c30', secondary: '#52665c' },
    background: { default: '#fcfbf6', paper: '#fffefa' },
  },
  typography: {
    fontFamily: '"Segoe UI", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 650 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 48, padding: '11px 16px' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fffefa', '& fieldset': { borderColor: '#cbd6c2' } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', minHeight: 46, fontWeight: 650, fontSize: '.84rem', minWidth: 0 },
      },
    },
  },
});
