// Real-Time WebSocket Event Bus for NeuroClaw & OpenClaw
// Ponytail: <=75 lines, native browser WebSocket, zero npm dependencies

import { getApiHost } from './bridge';

let socket = null;
let reconnectTimer = null;
const listeners = new Set();

export function getWsUrl() {
  return `ws://${getApiHost()}:8000/api/ws`;
}

export function subscribeRealtime(callback) {
  listeners.add(callback);
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connectRealtime();
  }
  return () => listeners.delete(callback);
}

export function sendRealtime(type, payload = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
    return true;
  }
  return false;
}

export function connectRealtime() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  try {
    socket = new WebSocket(getWsUrl());

    socket.onopen = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      listeners.forEach((cb) => cb({ type: 'connection', status: 'connected' }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        listeners.forEach((cb) => cb(msg));
      } catch (_) {}
    };

    socket.onerror = () => {
      listeners.forEach((cb) => cb({ type: 'connection', status: 'error' }));
    };

    socket.onclose = () => {
      listeners.forEach((cb) => cb({ type: 'connection', status: 'disconnected' }));
      reconnectTimer = setTimeout(connectRealtime, 2500);
    };
  } catch (_) {
    reconnectTimer = setTimeout(connectRealtime, 3500);
  }
}
