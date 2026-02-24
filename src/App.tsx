import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from './theme';
import Dashboard from './components/Dashboard';
import TacticalMap from './components/TacticalMap';
import TeammateDetail from './components/TeammateDetail';
import SOSModal from './components/SOSModal';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { setCurrentGps } = useAppStore();

  useEffect(() => {
    // Request GPS permission and update every 10 seconds
    if (navigator.geolocation) {
      const updateGps = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentGps({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error("GPS error:", error);
          },
          { enableHighAccuracy: true }
        );
      };
      
      updateGps();
      const intervalId = setInterval(updateGps, 10000);
      return () => clearInterval(intervalId);
    }
  }, [setCurrentGps]);

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
