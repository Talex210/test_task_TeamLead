import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Typography, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0052CC',
    },
    secondary: {
      main: '#36B37E',
    },
  },
});

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Jira Project Assistant
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Помощник для управления проектом в Jira
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};