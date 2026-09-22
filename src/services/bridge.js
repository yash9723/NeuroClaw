// NeuroClaw Bridge — unified API host resolver
// Works in: browser (localhost/LAN), Capacitor APK (WebView)
// Priority: env var (build-time) → window.hostname (browser LAN) → loopback

export function getApiHost() {
  // 0. Runtime stored override (if user changed networks)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('neuroclaw_api_host');
    if (stored && stored.trim() !== '') return stored.trim();
  }

  // 1. Build-time env var — set via VITE_API_HOST in .env
  const env = import.meta.env.VITE_API_HOST;
  if (env && env.trim() !== '') return env.trim();

  // 2. Browser LAN mode — when opened via http://192.168.x.x:5173
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1' && h !== '0.0.0.0') return h;
  }

  // 3. Fallback — desktop dev / USB-only
  return '127.0.0.1';
}

export function setApiHost(host) {
  if (typeof window !== 'undefined' && host) {
    localStorage.setItem('neuroclaw_api_host', host.trim());
  }
}

export function apiUrl(path) {
  return `http://${getApiHost()}:8000${path}`;
}
