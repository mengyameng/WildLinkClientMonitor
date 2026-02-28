import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import TacticalMap from './components/TacticalMap';
import TeammateDetail from './components/TeammateDetail';
import SOSModal from './components/SOSModal';

export default function App()
{
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<TacticalMap />} />
          <Route path="/teammate/:id" element={<TeammateDetail />} />
        </Routes>
      </BrowserRouter>
      <SOSModal />
    </ThemeProvider>
  );
}