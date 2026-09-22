import React, { useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Pause } from 'lucide-react';
import PhoneInteractiveCanvas from './PhoneInteractiveCanvas';
import PhoneControlBar from './PhoneControlBar';
import { getDeviceDisplay } from '../services/deviceControl';
import { apiUrl } from '../services/bridge';
import { triggerHaptic } from '../services/haptics';

export default function ScreenMirrorStudio({ deviceStatus }) {
  const [fps, setFps] = useState(2); // 0 = Paused, 1 = 1fps, 2 = 2fps, 5 = 5fps
  const [screencapKey, setScreencapKey] = useState(Date.now());
  const [displayInfo, setDisplayInfo] = useState({ width: 1080, height: 2400, density: 440 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getDeviceDisplay().then(setDisplayInfo).catch(() => {}); }, []);
  const triggerRefresh = useCallback(() => setScreencapKey(Date.now()), []);

  useEffect(() => {
    if (fps <= 0) return;
    const timer = setInterval(() => setScreencapKey(Date.now()), Math.round(1000 / fps));
    return () => clearInterval(timer);
  }, [fps]);

  const handleManualSync = () => {
    setLoading(true);
    triggerHaptic('click');
    triggerRefresh();
    setTimeout(() => setLoading(false), 300);
  };

  const screencapUrl = `${apiUrl('/api/device/screencap')}?t=${screencapKey}`;

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-mono text-xs w-full">
      {/* Studio Header & Stream Controls */}
      <div className="glass-panel p-3.5 rounded-2xl border border-neuro-border bg-[#070A10] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">Phone Mirror & Touch Studio</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {fps > 0 ? `${fps} FPS Live` : 'Paused'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">{deviceStatus?.model || 'POCO X5 5G'} • {deviceStatus?.link_speed || 'USB/WiFi Bridge'}</p>
          </div>
        </div>

        {/* FPS & Stream Toolbar */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-black/60 border border-neuro-border rounded-xl p-0.5">
            {[0, 1, 2, 5].map((val) => (
              <button
                key={val}
                onClick={() => { setFps(val); triggerHaptic('click'); }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  fps === val ? 'bg-neuro-neon text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {val === 0 ? <Pause className="w-3 h-3" /> : `${val}F`}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualSync}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neuro-card hover:bg-neuro-border border border-neuro-border text-gray-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-neuro-orange' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Interactive Phone Canvas + Hardware Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 flex justify-center">
          <PhoneInteractiveCanvas
            screencapUrl={screencapUrl}
            displayInfo={displayInfo}
            onRefresh={triggerRefresh}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-5 space-y-3 flex flex-col items-center lg:items-start">
          <PhoneControlBar onRefresh={triggerRefresh} />

          <div className="glass-panel p-3 rounded-2xl border border-neuro-border bg-[#070A10] space-y-2 text-[11px] max-w-lg w-full">
            <div className="text-gray-400 font-bold uppercase tracking-wider text-[9px] flex items-center justify-between">
              <span>Display & Stream Specs</span>
              <span className="text-neuro-neon">Hexagon NPU 45 TOPS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-black/60 p-2 rounded-lg border border-neuro-border/60">
                <span className="text-gray-500 block text-[9px]">RESOLUTION</span>
                <span className="text-white font-bold">{displayInfo.width} x {displayInfo.height}</span>
              </div>
              <div className="bg-black/60 p-2 rounded-lg border border-neuro-border/60">
                <span className="text-gray-500 block text-[9px]">DENSITY / DPI</span>
                <span className="text-white font-bold">{displayInfo.density} DPI (120Hz)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
