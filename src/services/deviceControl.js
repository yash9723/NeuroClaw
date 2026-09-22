import { apiUrl } from './bridge';

export async function getDeviceDisplay() {
  try {
    const res = await fetch(apiUrl('/api/device/display'));
    if (!res.ok) throw new Error('Display API error');
    return await res.json();
  } catch (err) {
    return { width: 1080, height: 2400, density: 440, orientation: 0 };
  }
}

export async function sendTap({ x, y, pct_x, pct_y }) {
  const body = pct_x !== undefined ? { pct_x, pct_y } : { x, y };
  const res = await fetch(apiUrl('/api/device/control/tap'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

export async function sendSwipe({ x1, y1, x2, y2, duration_ms = 250 }) {
  const res = await fetch(apiUrl('/api/device/control/swipe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x1, y1, x2, y2, duration_ms })
  });
  return await res.json();
}

export async function sendKey(key) {
  const res = await fetch(apiUrl('/api/device/control/key'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  return await res.json();
}

export async function sendText(text) {
  const res = await fetch(apiUrl('/api/device/control/text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await res.json();
}

export async function sendAction(action) {
  const res = await fetch(apiUrl('/api/device/action'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  return await res.json();
}

export async function launchDesktopMirror() {
  const res = await fetch(apiUrl('/api/device/mirror/launch_desktop'), { method: 'POST' });
  return await res.json();
}
