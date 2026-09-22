// Wireless & Bluetooth Device Link Modal
// Ponytail: <=120 lines, zero npm dependencies

import React, { useState, useEffect } from 'react';
import { Wifi, X, RefreshCw, CheckCircle2, AlertCircle, Bluetooth } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';
import { getBluetoothStatus, triggerBluetoothPairing, triggerBluetoothTether, scanWebBluetooth } from '../services/bluetooth';

export default function WirelessConnectModal({ isOpen, onClose, onConnected }) {
  const [tab, setTab] = useState('wifi'); // 'wifi' | 'bluetooth'
  const [netInfo, setNetInfo] = useState({ host_ip: '192.168.0.153', web_url: 'http://192.168.0.153:5173' });
  const [btStatus, setBtStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(apiUrl('/api/network/info')).then(r => r.json()).then(setNetInfo).catch(() => {});
    getBluetoothStatus().then(setBtStatus);
  }, [isOpen]);

  if (!isOpen) return null;

  const runAction = async (fn, text) => {
    setLoading(true);
    triggerHaptic('click');
    if (text) setStatusMsg({ type: 'info', text });
    try {
      const res = await fn();
      if (res?.success) {
        setStatusMsg({ type: 'success', text: res.message || `Connected to ${res.name || res.phone_ip}!` });
        triggerHaptic('taskComplete');
        if (onConnected) onConnected();
      } else {
        setStatusMsg({ type: 'warning', text: res?.message || res?.error || 'Action completed.' });
      }
    } catch (_) { setStatusMsg({ type: 'error', text: 'Operation failed.' }); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
      <div className="bg-[#0D121F] border border-neuro-border rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-neuro-border/80">
          <span className="text-white font-bold text-sm flex items-center gap-1.5">
            {tab === 'wifi' ? <Wifi className="w-4 h-4 text-neuro-neon" /> : <Bluetooth className="w-4 h-4 text-cyan-400" />}
            <span>{tab === 'wifi' ? 'Wireless Link Manager' : 'Bluetooth Device Bridge'}</span>
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setTab('wifi')} className={`px-2 py-0.5 rounded text-[10px] ${tab === 'wifi' ? 'bg-neuro-neon text-black font-bold' : 'text-gray-400'}`}>WiFi</button>
            <button onClick={() => setTab('bluetooth')} className={`px-2 py-0.5 rounded text-[10px] ${tab === 'bluetooth' ? 'bg-cyan-400 text-black font-bold' : 'text-gray-400'}`}>Bluetooth</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 ml-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : statusMsg.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{statusMsg.text}</span>
          </div>
        )}

        {tab === 'wifi' ? (
          <>
            <button onClick={() => runAction(() => fetch(apiUrl('/api/device/wireless/setup'), { method: 'POST' }).then(r => r.json()), 'Enabling ADB TCP 5555...')} disabled={loading} className="w-full bg-neuro-orange hover:bg-neuro-orange/90 text-black font-sans font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>1-Click Switch to Wireless ADB (Port 5555)</span>
            </button>
            <div className="bg-[#070A10] p-2.5 rounded-xl border border-neuro-border/60 space-y-1">
              <span className="text-gray-400 text-[10px]">Direct Web / PWA URL:</span>
              <div className="text-neuro-neon font-bold text-[11px] bg-black/80 px-2 py-1 rounded border border-neuro-border/40 select-all">{netInfo.web_url}</div>
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#070A10] border border-neuro-border/60 rounded-lg p-2">
                <span className="text-gray-500 block text-[9px]">PC BLUETOOTH</span>
                <span className="text-emerald-400 font-bold block">{btStatus?.pc_bluetooth_ready ? 'Intel BT Ready' : 'Offline'}</span>
              </div>
              <div className="bg-[#070A10] border border-neuro-border/60 rounded-lg p-2">
                <span className="text-gray-500 block text-[9px]">PHONE HARDWARE</span>
                <span className="text-white font-bold block truncate">{btStatus?.phone_name || 'POCO X5 5G'}</span>
                <span className="text-[8px] text-gray-500">{btStatus?.phone_address || 'E4:BC:AA:9D:D6:BF'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => runAction(triggerBluetoothPairing)} disabled={loading} className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold py-1.5 px-2 rounded-xl text-center">
                Pair Bluetooth
              </button>
              <button onClick={() => runAction(triggerBluetoothTether)} disabled={loading} className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold py-1.5 px-2 rounded-xl text-center">
                Bluetooth Tether (PAN)
              </button>
            </div>
            <button onClick={() => runAction(scanWebBluetooth)} disabled={loading} className="w-full bg-neuro-card hover:bg-neuro-border border border-neuro-border text-gray-200 py-1.5 px-2 rounded-xl text-center font-bold">
              Web Bluetooth Direct Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
