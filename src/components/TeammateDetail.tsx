import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, IconButton, AppBar, Toolbar, Grid } from '@mui/material';
import { ArrowBack, Warning } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';

export default function TeammateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { telemetryPool } = useAppStore();
  
  const teammate = telemetryPool[Number(id)];

  if (!teammate) {
    return (
      <Box p={2}>
        <Typography>未找到队友数据</Typography>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            队友详情
          </Typography>
        </Toolbar>
      </AppBar>

      <Box p={2} flexGrow={1}>
        <Card sx={{ mb: 2, border: teammate.need_help ? '2px solid red' : 'none' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold">
                {teammate.name} (ID: {teammate.id})
                {teammate.need_help === 1 && <Warning color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                更新于 {Math.floor((Date.now() - teammate.timestamp) / 60000)} 分钟前
              </Typography>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box width="calc(50% - 8px)">
                <Typography variant="body2" color="textSecondary">心率</Typography>
                <Typography variant="h5" fontWeight="bold" color={
                  (teammate.heart_rate < teammate.heart_rate_min || teammate.heart_rate > teammate.heart_rate_max) ? 'error' : 'inherit'
                }>
                  {teammate.heart_rate} bpm
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  范围: {teammate.heart_rate_min} - {teammate.heart_rate_max}
                </Typography>
              </Box>
              <Box width="calc(50% - 8px)">
                <Typography variant="body2" color="textSecondary">血氧</Typography>
                <Typography variant="h5" fontWeight="bold" color={
                  teammate.blood_oxygen < teammate.blood_oxygen_low ? 'error' : 'inherit'
                }>
                  {teammate.blood_oxygen}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  下限: {teammate.blood_oxygen_low}%
                </Typography>
              </Box>
              <Box width="calc(50% - 8px)">
                <Typography variant="body2" color="textSecondary">体温</Typography>
                <Typography variant="h5" fontWeight="bold" color={
                  (teammate.body_temp < teammate.body_temp_min || teammate.body_temp > teammate.body_temp_max) ? 'error' : 'inherit'
                }>
                  {teammate.body_temp.toFixed(1)}℃
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  范围: {teammate.body_temp_min.toFixed(1)} - {teammate.body_temp_max.toFixed(1)}
                </Typography>
              </Box>
              <Box width="calc(50% - 8px)">
                <Typography variant="body2" color="textSecondary">环境温度/湿度</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {teammate.air_temp.toFixed(1)}℃ / {teammate.air_humidity}%
                </Typography>
              </Box>
              <Box width="100%">
                <Typography variant="body2" color="textSecondary">气压</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {teammate.air_pressure.toFixed(1)} hPa
                </Typography>
              </Box>
              <Box width="100%">
                <Typography variant="body2" color="textSecondary">GPS 坐标</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {teammate.gps.latitude.toFixed(6)}, {teammate.gps.longitude.toFixed(6)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
