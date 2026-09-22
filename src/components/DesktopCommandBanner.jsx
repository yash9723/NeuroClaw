// Desktop Command Banner with live Mobile Remote Command Feed
// Ponytail: <=120 lines, native APIs

import React, { useState, useEffect } from 'react';
import { Radio, Cpu, ShieldCheck, Smartphone } from 'lucide-react';
import { apiUrl } from '../services/bridge';

export default function DesktopCommandBanner() {
  const [remoteCmd, setRemoteCmd] = useState(null);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(apiUrl('/api/sync/state'));
        if (res.ok) {
          const d = await res.json();
          if (d.last_remote_command) {
            setRemoteCmd(d.last_remote_command);
          }
        }
      } catch (_) {}
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0E1726] via-[#101F30] to-[#0E1726] border border-neuro-neon/30 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide text-xs">DUAL-MODE COMMAND CENTER</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              GREEN LIGHT ACTIVE
            </span>
            {remoteCmd && (
              <span className="bg-neuro-orange/20 text-neuro-orange text-[10px] font-bold px-2 py-0.2 rounded-full border border-neuro-orange/40 flex items-center gap-1 animate-pulse">
                <Smartphone className="w-3 h-3" />
                <span>Remote: {remoteCmd}</span>
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[11px]">
            Laptop Orchestration Engine ↔ Mobile Remote Controller Link
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-300">
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-neuro-border/60">
          <Cpu className="w-3.5 h-3.5 text-neuro-orange" />
          <span className="text-gray-400">NPU Bus:</span>
          <span className="font-bold text-neuro-orange">45 TOPS INT4</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-neuro-border/60">
          <ShieldCheck className="w-3.5 h-3.5 text-neuro-neon" />
          <span className="text-gray-400">Remote Gate:</span>
          <span className="font-bold text-neuro-neon">Enabled</span>
        </div>
      </div>
    </div>
  );
}
