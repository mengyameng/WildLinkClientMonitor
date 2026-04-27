import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Box, IconButton, Typography, AppBar, Toolbar } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import 'leaflet/dist/leaflet.css';

function MapUpdater({ center }: { center: [number, number] })
{
  const map = useMap();
  useEffect(() =>
  {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function TacticalMap()
{
  const navigate = useNavigate();
  const { connections, activeDeviceId, telemetryPool, currentGps } = useAppStore();

  const activeConnection = activeDeviceId ? connections[activeDeviceId] : null;
  const selfTelemetry = activeConnection ? telemetryPool[activeConnection.self_id!] : null;
  const teammates = Object.values(telemetryPool).filter(t => t.id !== activeConnection?.self_id);

  const defaultCenter: [number, number] = [39.9042, 116.4074]; // Beijing
  const center: [number, number] = selfTelemetry?.gps?.latitude && selfTelemetry?.gps?.longitude
    ? [selfTelemetry.gps.latitude, selfTelemetry.gps.longitude]
    : (currentGps ? [currentGps.latitude, currentGps.longitude] : defaultCenter);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="fixed" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            附近队友
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, position: 'relative', mt: { xs: '56px', sm: '64px' } }}>
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater center={center} />

          {/* Self Marker */}
          {selfTelemetry && selfTelemetry.gps.latitude !== 0 && (
            <CircleMarker
              center={[selfTelemetry.gps.latitude, selfTelemetry.gps.longitude]}
              radius={8}
              pathOptions={{ color: '#4cae4f', fillColor: '#4CAF50', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <Typography variant="body2" fontWeight="bold">我 ({selfTelemetry.name})</Typography>
                <br />
                <Typography variant="body2">Lat: {selfTelemetry.gps.latitude.toFixed(4)}°, Lon: {selfTelemetry.gps.longitude.toFixed(4)}°</Typography>
              </Tooltip>
            </CircleMarker>
          )}

          {/* Teammate Markers */}
          {teammates.map(t => (
            t.gps.latitude !== 0 && (
              <CircleMarker
                key={t.id}
                center={[t.gps.latitude, t.gps.longitude]}
                radius={t.need_help ? 12 : 8}
                pathOptions={{
                  color: t.need_help ? '#F44336' : '#2196F3',
                  fillColor: t.need_help ? '#F44336' : '#2196F3',
                  fillOpacity: t.need_help ? 0.8 : 1,
                  className: t.need_help ? 'sos-marker' : ''
                }}
                eventHandlers={{
                  click: () => navigate(`/teammate/${t.id}`)
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  <Typography variant="caption" fontWeight="bold" color={t.need_help ? 'error' : 'inherit'}>
                    {t.name} {t.need_help ? '(SOS)' : ''}
                  </Typography>
                  <br />
                  <Typography variant="caption">Lat: {t.gps.latitude.toFixed(4)}°, Lon: {t.gps.longitude.toFixed(4)}°</Typography>
                </Tooltip>
              </CircleMarker>
            )
          ))}
        </MapContainer>
      </Box>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .sos-marker {
          animation: pulse 1s infinite;
        }
      `}</style>
    </Box>
  );
}