import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress, Slider, FormControl, InputLabel, Input, FormHelperText } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { writeConfig } from '../services/bluetooth';

export default function SOSModal()
{
  const { sosActive, sosSourceId, clearSos, telemetryPool, activeDeviceId, connections, cooldownDuration, setCooldownDuration } = useAppStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [cooldownInput, setCooldownInput] = useState(cooldownDuration.toString());

  const activeConnection = activeDeviceId ? connections[activeDeviceId] : null;
  const isSelf = activeConnection && sosSourceId === activeConnection.self_id;

  useEffect(() =>
  {
    if (sosActive && !isSelf)
    {
      if (!audioRef.current)
      {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else
    {
      if (audioRef.current)
      {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () =>
    {
      if (audioRef.current)
      {
        audioRef.current.pause();
      }
    };
  }, [sosActive, isSelf]);

  const handleClose = () =>
  {
    clearSos();
  };

  const handleCooldownChange = (event: Event, newValue: number | number[]) =>
  {
    const value = typeof newValue === 'number' ? newValue : newValue[0];
    setCooldownDuration(value);
    setCooldownInput(value.toString());
  };

  const handleCooldownInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
  {
    setCooldownInput(event.target.value);
  };

  const handleCooldownInputBlur = () =>
  {
    const value = parseInt(cooldownInput);
    if (!isNaN(value) && value > 0)
    {
      setCooldownDuration(value);
    } else
    {
      setCooldownInput(cooldownDuration.toString());
    }
  };

  const handleClearSelfSos = async () =>
  {
    if (!activeConnection || !activeDeviceId) return;
    const selfTelemetry = telemetryPool[activeConnection.self_id!];
    if (selfTelemetry)
    {
      setIsClearing(true);
      try
      {
        const newTelemetry = { ...selfTelemetry, need_help: 0 };
        await writeConfig(activeDeviceId, newTelemetry);
        clearSos();
      } catch (e)
      {
        console.error("Failed to clear SOS:", e);
      } finally
      {
        setIsClearing(false);
      }
    } else
    {
      clearSos();
    }
  };

  if (!sosActive) return null;

  if (isSelf)
  {
    return (
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        bgcolor: 'error.main', color: 'error.contrastText', p: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Warning sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">SOS 已触发 (我自己)</Typography>
          <Button
            color="inherit"
            onClick={handleClearSelfSos}
            disabled={isClearing}
            sx={{ ml: 2, border: '1px solid white' }}
          >
            {isClearing ? <CircularProgress size={24} color="inherit" /> : '关闭提示'}
          </Button>
        </Box>

        {/* Cooldown Settings for Self SOS */}
        <Box sx={{ mt: 2, width: '90%', maxWidth: 400 }}>
          <Typography variant="body1" mb={1}>
            冷却时间设置: {cooldownDuration}秒
          </Typography>
          <Slider
            value={cooldownDuration}
            onChange={handleCooldownChange}
            min={1}
            max={60}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}s`}
            sx={{
              color: 'white',
              '& .MuiSlider-thumb': {
                bgcolor: 'white',
              },
              '& .MuiSlider-track': {
                bgcolor: 'white',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />
        </Box>
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
      <DialogContent sx={{ textAlign: 'center', mt: 4, width: '80%', maxWidth: 400 }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          队友 {sourceName} 发出求救信号！
        </Typography>
        <Typography variant="h6" mb={6}>
          请立即查看雷达地图确认其位置。
        </Typography>

        {/* Cooldown Settings */}
        <Box sx={{ mt: 4, width: '100%' }}>
          <Typography variant="h6" mb={2}>
            冷却时间设置
          </Typography>
          <Typography variant="body1" mb={3}>
            在此时间内不会重复弹出相同的 SOS 提示
          </Typography>

          <Slider
            value={cooldownDuration}
            onChange={handleCooldownChange}
            min={1}
            max={60}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}s`}
            sx={{
              color: 'white',
              '& .MuiSlider-thumb': {
                bgcolor: 'white',
              },
              '& .MuiSlider-track': {
                bgcolor: 'white',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControl sx={{ width: '80px', mr: 2 }}>
              <InputLabel sx={{ color: 'white' }} htmlFor="cooldown-input">秒</InputLabel>
              <Input
                id="cooldown-input"
                value={cooldownInput}
                onChange={handleCooldownInputChange}
                onBlur={handleCooldownInputBlur}
                type="number"
                min="1"
                max="60"
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              />
            </FormControl>
            <Typography variant="body1">秒</Typography>
          </Box>
        </Box>
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