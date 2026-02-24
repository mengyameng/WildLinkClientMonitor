export interface NodeTelemetry {
  id: number;
  need_help: number;
  name: string;
  heart_rate_min: number;
  heart_rate_max: number;
  heart_rate: number;
  blood_oxygen_low: number;
  blood_oxygen: number;
  body_temp_min: number;
  body_temp_max: number;
  body_temp: number;
  air_humidity: number;
  air_temp: number;
  air_pressure: number;
  gps: {
    longitude: number;
    latitude: number;
  };
  timestamp: number; // Ignored from device, but we use Date.now()
}

export function parseTelemetry(buffer: ArrayBuffer): NodeTelemetry {
  const view = new DataView(buffer);
  
  // Read name (char[10])
  const nameBytes = new Uint8Array(buffer, 2, 10);
  let name = "";
  for (let i = 0; i < 10; i++) {
    if (nameBytes[i] === 0) break;
    name += String.fromCharCode(nameBytes[i]);
  }

  return {
    id: view.getUint8(0),
    need_help: view.getUint8(1),
    name: name,
    heart_rate_min: view.getUint8(12),
    heart_rate_max: view.getUint8(13),
    heart_rate: view.getUint8(14),
    blood_oxygen_low: view.getUint8(15),
    blood_oxygen: view.getUint8(16),
    body_temp_min: view.getFloat32(17, true),
    body_temp_max: view.getFloat32(21, true),
    body_temp: view.getFloat32(25, true),
    air_humidity: view.getUint8(29),
    air_temp: view.getFloat32(30, true),
    air_pressure: view.getFloat32(34, true),
    gps: {
      longitude: view.getFloat32(38, true),
      latitude: view.getFloat32(42, true),
    },
    timestamp: Date.now(), // Override with current time
  };
}

export function serializeTelemetry(data: NodeTelemetry): ArrayBuffer {
  const buffer = new ArrayBuffer(50);
  const view = new DataView(buffer);
  
  view.setUint8(0, data.id);
  view.setUint8(1, data.need_help);
  
  // Write name
  const nameBytes = new TextEncoder().encode(data.name);
  for (let i = 0; i < 10; i++) {
    view.setUint8(2 + i, i < nameBytes.length ? nameBytes[i] : 0);
  }
  
  view.setUint8(12, data.heart_rate_min);
  view.setUint8(13, data.heart_rate_max);
  view.setUint8(14, data.heart_rate);
  view.setUint8(15, data.blood_oxygen_low);
  view.setUint8(16, data.blood_oxygen);
  
  view.setFloat32(17, data.body_temp_min, true);
  view.setFloat32(21, data.body_temp_max, true);
  view.setFloat32(25, data.body_temp, true);
  
  view.setUint8(29, data.air_humidity);
  view.setFloat32(30, data.air_temp, true);
  view.setFloat32(34, data.air_pressure, true);
  
  view.setFloat32(38, data.gps.longitude, true);
  view.setFloat32(42, data.gps.latitude, true);
  
  // Write timestamp
  view.setUint32(46, Math.floor(data.timestamp / 1000), true);
  
  return buffer;
}
