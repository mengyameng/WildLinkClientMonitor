import { DEVICE_NAME_FILTER, SERVICE_UUID, CHAR_A_UUID, CHAR_B_UUID, REQUIRED_MTU } from '../config';
import { parseTelemetry, serializeTelemetry, NodeTelemetry } from '../utils/parser';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

export async function connectDevice()
{
  try
  {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: DEVICE_NAME_FILTER }],
      optionalServices: [SERVICE_UUID]
    });

    const server = await device.gatt?.connect();
    if (!server) throw new Error("无法连接到 GATT 服务器");

    // Check MTU if available (Web Bluetooth might not expose this standardly, but requirement asks for it)
    if ((server as any).mtu && (server as any).mtu < REQUIRED_MTU)
    {
      toast.error("当前蓝牙 MTU 过小，配置同步可能失败", { duration: 5000 });
    }

    const service = await server.getPrimaryService(SERVICE_UUID);
    const charA = await service.getCharacteristic(CHAR_A_UUID);
    const charB = await service.getCharacteristic(CHAR_B_UUID);

    // Read self ID from Char B
    const selfIdView = await charB.readValue();
    const selfId = selfIdView.getUint8(0);

    useAppStore.getState().addConnection({
      deviceId: device.id,
      name: device.name || "Unknown Device",
      self_id: selfId,
      device,
      characteristicB: charB
    });

    // Setup notifications for Char A
    await charA.startNotifications();
    charA.addEventListener('characteristicvaluechanged', handleTelemetryNotification);

    device.addEventListener('gattserverdisconnected', () =>
    {
      useAppStore.getState().removeConnection(device.id);
      toast.error(`设备 ${device.name} 已断开连接`);
    });

    toast.success(`已连接到 ${device.name}`);
    return device;
  } catch (error)
  {
    console.error(error);
    toast.error("蓝牙连接失败: " + (error as Error).message);
    throw error;
  }
}

function handleTelemetryNotification(event: Event)
{
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const value = target.value;
  if (!value) return;

  const telemetry = parseTelemetry(value.buffer);

  // Update state
  useAppStore.getState().updateTelemetry(telemetry);

  // Check SOS
  if (telemetry.need_help === 1)
  {
    const state = useAppStore.getState();
    state.triggerSos(telemetry.id);
  }

  // Check anomalies
  if (telemetry.heart_rate < telemetry.heart_rate_min || telemetry.heart_rate > telemetry.heart_rate_max)
  {
    toast(`警告：${telemetry.name} 心率异常 (${telemetry.heart_rate})`, { icon: '⚠️' });
  }
  if (telemetry.blood_oxygen < telemetry.blood_oxygen_low)
  {
    toast(`警告：${telemetry.name} 血氧异常 (${telemetry.blood_oxygen}%)`, { icon: '⚠️' });
  }
  if (telemetry.body_temp < telemetry.body_temp_min || telemetry.body_temp > telemetry.body_temp_max)
  {
    toast(`警告：${telemetry.name} 体温异常 (${telemetry.body_temp}℃)`, { icon: '⚠️' });
  }
}

export async function writeConfig(deviceId: string, telemetry: NodeTelemetry)
{
  const state = useAppStore.getState();
  const conn = state.connections[deviceId];
  if (!conn || !conn.characteristicB)
  {
    toast.error("设备未连接或不支持写入");
    return;
  }

  try
  {
    const buffer = serializeTelemetry(telemetry);
    await conn.characteristicB.writeValue(buffer);
    toast.success("配置已发送");
  } catch (error)
  {
    console.error(error);
    toast.error("配置发送失败");
  }
}