import React, { useState, useEffect } from 'react';
import { Wifi, X, Smartphone, Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';

export default function WirelessConnectModal({ isOpen, onClose, onConnected }) {
  const [netInfo, setNetInfo] = useState({ host_ip: '192.168.55.40', web_url: 'http://192.168.55.40:5173' });
  const [phoneIp, setPhoneIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(apiUrl('/api/network/info'))
      .then(res => res.json())
      .then(d => {
        setNetInfo(d);
        if (d.detected_phone_ip) setPhoneIp(d.detected_phone_ip);
        else if (d.host_ip) setPhoneIp(d.host_ip.substring(0, d.host_ip.lastIndexOf('.') + 1));
      }).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoSetup = async () => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Enabling ADB TCP 5555 & checking phone WiFi...' });
    triggerHaptic('click');
    try {
      const res = await fetch(apiUrl('/api/device/wireless/setup'), { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `Connected wirelessly to ${data.phone_ip}! You can unplug cable.` });
        triggerHaptic('taskComplete');
        if (onConnected) onConnected();
      } else {
        setStatusMsg({ type: 'warning', text: data.message || 'Phone WiFi not found. Connect to WiFi or enter IP.' });
      }
    } catch (_) { setStatusMsg({ type: 'error', text: 'Gateway API unreachable.' }); }
    setLoading(false);
  };

  const handleManualConnect = async () => {
    if (!phoneIp || phoneIp.endsWith('.')) return;
    setLoading(true);
    triggerHaptic('click');
    try {
      const res = await fetch(apiUrl('/api/device/wireless/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: phoneIp.trim(), port: 5555 })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `Connected wirelessly to ${data.target}! You can unplug cable.` });
        triggerHaptic('taskComplete');
        if (onConnected) onConnected();
      } else { setStatusMsg({ type: 'error', text: data.output || 'Could not connect.' }); }
    } catch (_) { setStatusMsg({ type: 'error', text: 'Connection failed.' }); }
    setLoading(false);
  };

  const openWifi = () => fetch(apiUrl('/api/device/action'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'wifi_settings' })
  }).catch(() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
      <div className="bg-[#0D121F] border border-neuro-border rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-neuro-border/80">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Wifi className="w-4 h-4 text-neuro-neon animate-pulse" />
            <span>Wireless Device Link Manager</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        {statusMsg && (
          <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
            statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
            statusMsg.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            'bg-blue-500/20 text-blue-300 border border-blue-500/40'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <button
          onClick={handleAutoSetup}
          disabled={loading}
          className="w-full bg-neuro-orange hover:bg-neuro-orange/90 text-black font-sans font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>1-Click Switch to Wireless ADB (Port 5555)</span>
        </button>

        <div className="bg-[#070A10] p-2.5 rounded-xl border border-neuro-border/60 space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-400">Manual Phone IP Connect:</span>
            <button onClick={openWifi} className="text-neuro-neon hover:underline flex items-center gap-1 text-[9px]">
              <Smartphone className="w-2.5 h-2.5" /> Open Phone WiFi Settings
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={phoneIp}
              onChange={(e) => setPhoneIp(e.target.value)}
              placeholder="e.g. 192.168.55.105"
              className="flex-1 bg-black/60 border border-neuro-border rounded-lg px-2.5 py-1 text-white text-[11px] focus:outline-none focus:border-neuro-neon"
            />
            <button onClick={handleManualConnect} disabled={loading} className="bg-neuro-neon text-black font-bold font-sans px-3 py-1 rounded-lg text-xs hover:bg-cyan-300">
              Connect
            </button>
          </div>
        </div>

        <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1">
          <span className="text-gray-400 text-[10px] flex items-center gap-1">
            <Globe className="w-3 h-3 text-emerald-400" /> Zero-Cable Web / PWA Direct URL
          </span>
          <div className="text-neuro-neon font-bold text-[11px] select-all bg-black/80 px-2 py-1 rounded border border-neuro-border/40">
            {netInfo.web_url || 'http://192.168.55.40:5173'}
          </div>
          <p className="text-[9px] text-gray-500">Open on phone browser: syncs directly over WiFi without any cable or ADB.</p>
        </div>
      </div>
    </div>
  );
}
