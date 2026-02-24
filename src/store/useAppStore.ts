import { create } from 'zustand';
import { NodeTelemetry } from '../utils/parser';

export interface DeviceConnection {
  deviceId: string;
  name: string;
  self_id: number | null;
  device: BluetoothDevice;
  characteristicB: BluetoothRemoteGATTCharacteristic | null;
}

interface AppState {
  connections: Record<string, DeviceConnection>;
  activeDeviceId: string | null;
  telemetryPool: Record<number, NodeTelemetry>;
  
  addConnection: (conn: DeviceConnection) => void;
  removeConnection: (deviceId: string) => void;
  setActiveDevice: (deviceId: string) => void;
  updateTelemetry: (data: NodeTelemetry) => void;
  updateSelfId: (deviceId: string, selfId: number) => void;
  
  // GPS
  currentGps: { latitude: number; longitude: number } | null;
  setCurrentGps: (gps: { latitude: number; longitude: number }) => void;
  
  // Alerts
  sosActive: boolean;
  sosSourceId: number | null;
  triggerSos: (sourceId: number) => void;
  clearSos: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  connections: {},
  activeDeviceId: null,
  telemetryPool: {},
  
  addConnection: (conn) => set((state) => ({
    connections: { ...state.connections, [conn.deviceId]: conn },
    activeDeviceId: state.activeDeviceId || conn.deviceId
  })),
  
  removeConnection: (deviceId) => set((state) => {
    const newConns = { ...state.connections };
    delete newConns[deviceId];
    return {
      connections: newConns,
      activeDeviceId: state.activeDeviceId === deviceId ? Object.keys(newConns)[0] || null : state.activeDeviceId
    };
  }),
  
  setActiveDevice: (deviceId) => set({ activeDeviceId: deviceId }),
  
  updateTelemetry: (data) => set((state) => ({
    telemetryPool: { ...state.telemetryPool, [data.id]: { ...data, timestamp: Date.now() } }
  })),
  
  updateSelfId: (deviceId, selfId) => set((state) => {
    const conn = state.connections[deviceId];
    if (!conn) return state;
    return {
      connections: {
        ...state.connections,
        [deviceId]: { ...conn, self_id: selfId }
      }
    };
  }),
  
  currentGps: null,
  setCurrentGps: (gps) => set({ currentGps: gps }),
  
  sosActive: false,
  sosSourceId: null,
  triggerSos: (sourceId) => set({ sosActive: true, sosSourceId: sourceId }),
  clearSos: () => set({ sosActive: false, sosSourceId: null })
}));
