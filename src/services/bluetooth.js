// Bluetooth Hardware Link & Web Bluetooth Service
// Ponytail: <=75 lines, standard browser & gateway APIs only

import { apiUrl } from './bridge';

export function isBluetoothSupported() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export async function getBluetoothStatus() {
  try {
    const res = await fetch(apiUrl('/api/device/bluetooth/status'));
    if (res.ok) return await res.json();
  } catch (_) {}
  return { pc_bluetooth: false, phone_bluetooth: false, connected: false };
}

export async function triggerBluetoothPairing() {
  try {
    const res = await fetch(apiUrl('/api/device/bluetooth/pair'), { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (_) {}
  return { success: false, message: 'Bluetooth gateway unreachable' };
}

export async function triggerBluetoothTether() {
  try {
    const res = await fetch(apiUrl('/api/device/bluetooth/tether'), { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (_) {}
  return { success: false, message: 'Tethering trigger failed' };
}

export async function scanWebBluetooth() {
  if (!isBluetoothSupported()) {
    return { success: false, error: 'Web Bluetooth not supported in this browser' };
  }
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['generic_access', 'battery_service']
    });
    return { success: true, name: device.name || 'Bluetooth Device', id: device.id };
  } catch (err) {
    return { success: false, error: err.message || 'Cancelled' };
  }
}
