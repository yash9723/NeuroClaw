import React, { useState } from 'react';
import { Camera, RefreshCw, Maximize2, ShieldCheck, Smartphone } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';

export default function PhysicalScreenMirror({ refreshKey, onRefresh }) {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const imgUrl = `${apiUrl('/api/device/screencap')}?t=${refreshKey || Date.now()}`;

  const handleManualRefresh = () => {
    setLoading(true);
    setHasError(false);
    triggerHaptic('click');
    if (onRefresh) onRefresh();
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-neuro-border bg-[#070A10] relative overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neuro-border/60">
        <div className="flex items-center gap-1.5 text-neuro-orange font-bold text-[11px] uppercase tracking-wider">
          <Camera className="w-3.5 h-3.5" />
          <span>Physical Screen Stream</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neuro-orange/20 text-neuro-orange">
            ADB Raw
          </span>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-neuro-card px-2 py-0.5 rounded border border-neuro-border transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-neuro-orange' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      <div className="relative w-full h-56 sm:h-64 rounded-xl bg-black border border-neuro-border/80 overflow-hidden flex items-center justify-center">
        {!hasError ? (
          <img
            src={imgUrl}
            alt="Physical Device Screen Mirror"
            className="w-full h-full object-contain select-none"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="text-center p-4 space-y-2">
            <Smartphone className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-[11px]">Direct ADB Screencap Stream</p>
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 rounded bg-neuro-card border border-neuro-border text-neuro-neon text-[10px] font-sans"
            >
              Retry Connection
            </button>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 text-[9px] text-gray-300">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>1080x2400 @ 120Hz</span>
          </span>
          <span className="text-neuro-neon">Hardware Synced</span>
        </div>
      </div>
    </div>
  );
}
