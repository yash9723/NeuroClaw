import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, RefreshCw, Wifi } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import WirelessConnectModal from './WirelessConnectModal';
import { apiUrl } from '../services/bridge';

export default function DeviceBridgeCard({ mirrorMode, setMirrorMode, onRefreshMirror, onOpenMirrorStudio }) {
  const [device, setDevice] = useState({
    connected: true, serial: '90af15c70000', model: 'POCO X5 (Snapdragon NPU)',
    battery_level: 88, temperature_c: 36.0, connection_type: 'usb', link_speed: 'USB 3.0 (0.8ms)'
  });
  const [loading, setLoading] = useState(false);
  const [isWirelessOpen, setIsWirelessOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl('/api/device/status'));
      if (res.ok) setDevice(await res.json());
    } catch (_) {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const sendAction = async (action) => {
    setLoading(true);
    triggerHaptic('click');
    try {
      await fetch(apiUrl('/api/device/action'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (onRefreshMirror) onRefreshMirror();
      await fetchStatus();
    } catch (_) {}
    setLoading(false);
  };

  const isWifi = device.connection_type === 'wireless';

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-neuro-border bg-[#0B0F19]/90 relative overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-neuro-border/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWifi ? 'bg-neuro-neon' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isWifi ? 'bg-neuro-neon' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center gap-1">
            <span>{isWifi ? 'Wireless Link' : 'Hardware Link'}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isWifi ? 'bg-cyan-500/20 text-neuro-neon border border-cyan-500/40' : 'bg-emerald-500/20 text-emerald-300'}`}>{isWifi ? '📶 WiFi' : '🔌 USB'}</span>
            <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">⚡ BT</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setMirrorMode('perception'); triggerHaptic('click'); }} className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${mirrorMode === 'perception' ? 'bg-neuro-neon text-black' : 'text-gray-400 hover:text-white'}`}>Perception</button>
          <button onClick={() => { if (onOpenMirrorStudio) onOpenMirrorStudio(); else setMirrorMode('physical'); triggerHaptic('click'); }} className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-cyan-400 text-black hover:bg-cyan-300">Studio ↗</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-2.5 text-[10px]">
        <div className="bg-[#070A10] border border-neuro-border/60 rounded-lg p-2">
          <span className="text-gray-500 block text-[9px]">TARGET DEVICE</span>
          <span className="text-white font-bold truncate block">{device.connected ? device.model.split('(')[0] : 'WiFi Web Link'}</span>
        </div>
        <div className="bg-[#070A10] border border-neuro-border/60 rounded-lg p-2">
          <span className="text-gray-500 block text-[9px]">{device.connected ? 'BATTERY / TEMP' : 'PHONE URL'}</span>
          <span className="text-emerald-400 font-bold truncate block">{device.connected ? `${device.battery_level}% | ${device.temperature_c}°C` : ':5173 LAN'}</span>
        </div>
        <div className="bg-[#070A10] border border-neuro-border/60 rounded-lg p-2">
          <span className="text-gray-500 block text-[9px]">LINK SPEED</span>
          <span className={`font-bold truncate block ${isWifi ? 'text-neuro-neon' : device.connected ? 'text-emerald-400' : 'text-purple-400'}`}>{device.connected ? device.link_speed : 'Zero-Cable LAN'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 pt-1">
        <button
          onClick={() => { setIsWirelessOpen(true); triggerHaptic('click'); }}
          className="flex-1 bg-neuro-neon/10 hover:bg-neuro-neon/20 border border-neuro-neon/40 py-1 px-2 rounded-lg text-neuro-neon text-[10px] font-sans font-bold flex items-center justify-center gap-1 transition-all"
        >
          <Wifi className="w-3 h-3 text-neuro-neon" />
          <span>{isWifi ? 'Wireless / BT Link' : 'Wireless / BT'}</span>
        </button>
        <button
          onClick={() => sendAction('wake')}
          disabled={loading}
          className="bg-neuro-card hover:bg-neuro-border border border-neuro-border py-1 px-2.5 rounded-lg text-gray-300 text-[10px] font-sans font-medium flex items-center gap-1 transition-all"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Wake</span>
        </button>
        <button
          onClick={() => sendAction('launch_app')}
          disabled={loading}
          className="bg-neuro-card hover:bg-neuro-border border border-neuro-border py-1 px-2.5 rounded-lg text-gray-300 text-[10px] font-sans font-medium flex items-center gap-1 transition-all"
        >
          <Smartphone className="w-3 h-3 text-neuro-neon" />
          <span>APK</span>
        </button>
        <button
          onClick={() => { if (onRefreshMirror) onRefreshMirror(); fetchStatus(); }}
          className="bg-neuro-card hover:bg-neuro-border border border-neuro-border p-1.5 rounded-lg text-gray-300 transition-all"
          title="Refresh Stream"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-neuro-orange' : ''}`} />
        </button>
      </div>

      <WirelessConnectModal
        isOpen={isWirelessOpen}
        onClose={() => setIsWirelessOpen(false)}
        onConnected={() => { fetchStatus(); setIsWirelessOpen(false); }}
      />
    </div>
  );
}
