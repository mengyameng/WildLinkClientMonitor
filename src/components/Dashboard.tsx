import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import
{
  Box, Typography, Card, CardContent, Button,
  Select, MenuItem, FormControl, InputLabel,
  Grid, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField
} from '@mui/material';
import { Settings, Warning, Map as MapIcon, Bluetooth, Refresh } from '@mui/icons-material';
import { useAppStore } from '../store/useAppStore';
import { connectDevice, writeConfig } from '../services/bluetooth';
import { NodeTelemetry } from '../utils/parser';
import toast from 'react-hot-toast';

export default function Dashboard()
{
  const navigate = useNavigate();
  const { connections, activeDeviceId, setActiveDevice, telemetryPool, currentGps, setCurrentGps } = useAppStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<NodeTelemetry>>({});

  // 核心修改1：用useRef存储watchId（消除state更新触发的re-render）
  const gpsWatchIdRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const activeConnection = activeDeviceId ? connections[activeDeviceId] : null;
  const selfTelemetry = activeConnection ? telemetryPool[activeConnection.self_id!] : null;
  const teammates = Object.values(telemetryPool).filter(t => t.id !== activeConnection?.self_id);

  const handleConnect = async () =>
  {
    try
    {
      // Initialize AudioContext on user interaction
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext)
      {
        new AudioContext().resume();
      }

      // Start GPS updates (同步手势中调用，符合浏览器策略)
      if (navigator.geolocation)
      {
        // 清理已有监听（操作ref，无re-render）
        if (gpsWatchIdRef.current !== null)
        {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
          gpsWatchIdRef.current = null;
        }
        lastUpdateTime.current = 0;

        // 创建watchPosition（同步手势内，无违规）
        const watchId = navigator.geolocation.watchPosition(
          (position) =>
          {
            const now = Date.now();
            // 仅每10秒更新一次GPS（和你原逻辑一致）
            if (now - lastUpdateTime.current >= 10000)
            {
              setCurrentGps({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              lastUpdateTime.current = now;
              // 可选：打开注释查看GPS更新日志
              console.log("GPS更新：", position.coords.latitude, position.coords.longitude);
            }
          },
          (error) =>
          {
            console.error("GPS error:", error);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        // 仅更新ref，不触发组件重渲染 → 消除窗口期
        gpsWatchIdRef.current = watchId;
      }

      await connectDevice();

    } catch (e)
    {
      console.error("连接设备失败：", e);
    }
  };

  const handleSOS = async () =>
  {
    if (!selfTelemetry || !activeConnection) return;
    const newTelemetry = { ...selfTelemetry, need_help: 1 };
    if (currentGps)
    {
      newTelemetry.gps = currentGps;
    }
    await writeConfig(activeConnection.deviceId, newTelemetry);
    toast.success("SOS 已发送");
  };

  const handleSaveConfig = async () =>
  {
    if (!selfTelemetry || !activeConnection) return;

    if (editingConfig.name !== undefined && editingConfig.name.trim() === '')
    {
      toast.error("名称不能为空");
      return;
    }

    const newTelemetry = { ...selfTelemetry, ...editingConfig };
    if (currentGps)
    {
      newTelemetry.gps = currentGps;
    }
    await writeConfig(activeConnection.deviceId, newTelemetry);
    setConfigOpen(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    let val = e.target.value;
    // Filter non-ASCII characters
    const asciiVal = val.replace(/[^\x00-\x7F]/g, '');

    if (asciiVal !== val)
    {
      toast.error("仅允许输入英文字符或数字");
    }

    if (asciiVal.length > 9)
    {
      toast.error("名称过长，已自动截断");
      setEditingConfig({ ...editingConfig, name: asciiVal.substring(0, 9) });
    } else
    {
      setEditingConfig({ ...editingConfig, name: asciiVal });
    }
  };

  // Auto-inject GPS every 10s if we have a connection（原有逻辑不变）
  useEffect(() =>
  {
    if (!activeConnection || !selfTelemetry || !currentGps)
    {
      console.log('GPS auto-inject skipped:', {
        activeConnection: !!activeConnection,
        selfTelemetry: !!selfTelemetry,
        currentGps: !!currentGps
      });
      return;
    }
    else
    {
      console.log('GPS auto-inject triggered:', { activeConnection, selfTelemetry, currentGps });
      console.log("activeConnection 变了吗?", activeConnection?.deviceId);
      console.log("selfTelemetry 变了吗?", selfTelemetry?.id, selfTelemetry?.timestamp);
      console.log("currentGps 变了吗?", currentGps?.latitude, currentGps?.longitude);
    }

    const intervalId = setInterval(() =>
    {
      const newTelemetry = { ...selfTelemetry, gps: currentGps };
      writeConfig(activeConnection.deviceId, newTelemetry);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [activeConnection, selfTelemetry, currentGps]);

  // 核心修改2：清理逻辑1 - 仅监听connections变化（无窗口期）
  useEffect(() =>
  {
    const hasConnections = Object.keys(connections).length > 0;
    // 仅当“无设备 + 有watchId”时清理
    if (!hasConnections && gpsWatchIdRef.current !== null)
    {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  }, [connections]); // 仅依赖connections，无watchId → 无窗口期

  // 核心修改3：清理逻辑2 - 组件卸载时强制清理（防止内存泄漏）
  useEffect(() =>
  {
    return () =>
    {
      if (gpsWatchIdRef.current !== null)
      {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, []); // 空依赖，仅卸载时执行

  // 原有UI结构完全保留
  return (
    <Box sx={{ p: 2, pb: 10, maxWidth: '600px', mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">户外监测系统</Typography>
        <Button
          variant="contained"
          startIcon={<Bluetooth />}
          onClick={handleConnect}
          size="small"
        >
          连接设备
        </Button>
      </Box>

      {Object.keys(connections).length > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>当前活跃设备</InputLabel>
          <Select
            value={activeDeviceId || ''}
            label="当前活跃设备"
            onChange={(e) => setActiveDevice(e.target.value)}
          >
            {Object.values(connections).map(conn => (
              <MenuItem key={conn.deviceId} value={conn.deviceId}>
                {conn.name} (ID: {conn.self_id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selfTelemetry ? (
        <>
          {/* 生命体征卡片 */}
          <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  {selfTelemetry.name} (我自己) - 生命体征
                </Typography>
                <IconButton color="inherit" onClick={() =>
                {
                  setEditingConfig({
                    name: selfTelemetry.name,
                    heart_rate_min: selfTelemetry.heart_rate_min,
                    heart_rate_max: selfTelemetry.heart_rate_max,
                    blood_oxygen_low: selfTelemetry.blood_oxygen_low,
                    body_temp_min: selfTelemetry.body_temp_min,
                    body_temp_max: selfTelemetry.body_temp_max,
                  });
                  setConfigOpen(true);
                }}>
                  <Settings />
                </IconButton>
              </Box>

              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box width="calc(50% - 8px)">
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>心率</Typography>
                  <Typography variant="h4" fontWeight="bold">{selfTelemetry.heart_rate} bpm</Typography>
                </Box>
                <Box width="calc(50% - 8px)">
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>血氧</Typography>
                  <Typography variant="h4" fontWeight="bold">{selfTelemetry.blood_oxygen}%</Typography>
                </Box>
                <Box width="calc(50% - 8px)">
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>体温</Typography>
                  <Typography variant="h4" fontWeight="bold">{selfTelemetry.body_temp.toFixed(1)}℃</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 环境数据卡片 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                环境数据
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box width="calc(50% - 8px)">
                  <Typography variant="body2" color="textSecondary">环境温度</Typography>
                  <Typography variant="h5" fontWeight="bold">{selfTelemetry.air_temp.toFixed(1)}℃</Typography>
                </Box>
                <Box width="calc(50% - 8px)">
                  <Typography variant="body2" color="textSecondary">环境湿度</Typography>
                  <Typography variant="h5" fontWeight="bold">{selfTelemetry.air_humidity}%</Typography>
                </Box>
                <Box width="100%">
                  <Typography variant="body2" color="textSecondary">环境气压</Typography>
                  <Typography variant="h5" fontWeight="bold">{selfTelemetry.air_pressure.toFixed(1)} hPa</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography color="textSecondary" align="center">等待设备数据...</Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" fontWeight="bold" mb={2}>队友列表</Typography>
      {teammates.length > 0 ? (
        teammates.map(t => (
          <Card
            key={t.id}
            sx={{ mb: 2, cursor: 'pointer', border: t.need_help ? '2px solid red' : 'none' }}
            onClick={() => navigate(`/teammate/${t.id}`)}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  {t.name} (ID: {t.id})
                  {t.need_help === 1 && <Warning color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {Math.floor((Date.now() - t.timestamp) / 60000)} 分钟前
                </Typography>
              </Box>
              <Typography variant="body2">
                心率: {t.heart_rate} | 血氧: {t.blood_oxygen}% | 体温: {t.body_temp.toFixed(1)}℃
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography color="textSecondary" align="center" mb={3}>暂无队友数据</Typography>
      )}

      {/* Fixed Bottom Actions */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'background.paper', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', display: 'flex', gap: 2, zIndex: 1000 }}>
        <Button
          variant="contained"
          color="error"
          fullWidth
          size="large"
          onClick={handleSOS}
          disabled={!selfTelemetry}
          sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}
        >
          SOS 紧急求助
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/map')}
          sx={{ minWidth: '80px' }}
        >
          <MapIcon />
        </Button>
      </Box>

      {/* Config Dialog */}
      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} fullWidth>
        <DialogTitle>设备配置</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            {/* 配置名称 */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>配置名称</Typography>
              <TextField
                fullWidth
                label="设备名称 (最多9个英文字符)"
                value={editingConfig.name || ''}
                onChange={handleNameChange}
                helperText="仅支持英文字母、数字及基础符号"
              />
            </Box>

            {/* 配置报警阈值 */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>配置报警阈值</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="心率下限"
                  type="number"
                  value={editingConfig.heart_rate_min ?? 0}
                  onChange={e => setEditingConfig({ ...editingConfig, heart_rate_min: Number(e.target.value) })}
                />
                <TextField
                  label="心率上限"
                  type="number"
                  value={editingConfig.heart_rate_max ?? 0}
                  onChange={e => setEditingConfig({ ...editingConfig, heart_rate_max: Number(e.target.value) })}
                />
                <TextField
                  label="血氧下限"
                  type="number"
                  value={editingConfig.blood_oxygen_low ?? 0}
                  onChange={e => setEditingConfig({ ...editingConfig, blood_oxygen_low: Number(e.target.value) })}
                />
                <TextField
                  label="体温下限"
                  type="number"
                  value={editingConfig.body_temp_min ?? 0}
                  onChange={e => setEditingConfig({ ...editingConfig, body_temp_min: Number(e.target.value) })}
                />
                <TextField
                  label="体温上限"
                  type="number"
                  value={editingConfig.body_temp_max ?? 0}
                  onChange={e => setEditingConfig({ ...editingConfig, body_temp_max: Number(e.target.value) })}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigOpen(false)}>取消</Button>
          <Button onClick={handleSaveConfig} variant="contained">保存并同步</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}