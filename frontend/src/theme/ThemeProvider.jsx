import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(
    () => ({ toggleColorMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')) }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1565C0' },
          secondary: { main: '#EF6C00' },
          background: {
            default: mode === 'light' ? '#F0F2F5' : '#121212',
            paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          },
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
          MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } } },
          MuiTableHead: {
            styleOverrides: { root: { '& .MuiTableCell-head': { fontWeight: 700, backgroundColor: mode === 'light' ? '#EEF2FF' : '#2A2A3E' } } },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};
