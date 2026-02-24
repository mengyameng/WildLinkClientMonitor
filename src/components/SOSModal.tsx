import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';

export default function SOSModal() {
  const { sosActive, sosSourceId, clearSos, telemetryPool, activeDeviceId, connections } = useAppStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeConnection = activeDeviceId ? connections[activeDeviceId] : null;
  const isSelf = activeConnection && sosSourceId === activeConnection.self_id;

  useEffect(() => {
    if (sosActive && !isSelf) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [sosActive, isSelf]);

  const handleClose = () => {
    clearSos();
  };

  if (!sosActive) return null;

  if (isSelf) {
    return (
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        bgcolor: 'error.main', color: 'error.contrastText', p: 2,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        boxShadow: 3
      }}>
        <Warning sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold">SOS 已触发 (我自己)</Typography>
        <Button color="inherit" onClick={clearSos} sx={{ ml: 2, border: '1px solid white' }}>关闭提示</Button>
      </Box>
    );
  }

  const sourceName = sosSourceId ? telemetryPool[sosSourceId]?.name || `ID: ${sosSourceId}` : "未知";

  return (
    <Dialog
      open={sosActive}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'error.main',
          color: 'error.contrastText',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'flash 1s infinite alternate'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Warning sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h3" fontWeight="bold">紧急求助 SOS</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          队友 {sourceName} 发出求救信号！
        </Typography>
        <Typography variant="h6">
          请立即查看雷达地图确认其位置。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', mt: 4, pb: 8 }}>
        <Button 
          variant="contained" 
          color="inherit" 
          size="large" 
          onClick={handleClose}
          sx={{ color: 'error.main', bgcolor: 'white', fontWeight: 'bold', fontSize: '1.5rem', px: 6, py: 2 }}
        >
          确认收到
        </Button>
      </DialogActions>
      <style>{`
        @keyframes flash {
          0% { background-color: #D32F2F; }
          100% { background-color: #F44336; }
        }
      `}</style>
    </Dialog>
  );
}
