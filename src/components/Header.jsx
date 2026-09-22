import React from 'react';
import { Zap, Smartphone, Monitor, Flame, LayoutDashboard, Cast } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export default function Header({ 
  monsterMode, setMonsterMode, deviceView, setDeviceView,
  batteryLevel, isCharging, temperature, activePage, setActivePage
}) {
  const toggleMonsterMode = () => {
    const next = !monsterMode;
    setMonsterMode(next);
    triggerHaptic(next ? 'monsterPulse' : 'click');
  };

  return (
    <header className="border-b border-neuro-border bg-neuro-dark/95 backdrop-blur-md sticky top-0 z-40 px-3 pt-8 pb-2.5 sm:px-4 sm:pt-9 sm:pb-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="relative">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
              monsterMode ? 'bg-gradient-to-br from-neuro-orange to-yellow-500 text-black neon-glow-orange animate-pulse' : 'bg-neuro-card border border-neuro-border text-neuro-neon'
            }`}>⚡</div>
            {monsterMode && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neuro-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neuro-orange"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base md:text-lg">
                <span className="text-neuro-orange">Neuro</span><span className="text-neuro-neon">Claw</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neuro-border text-gray-300">v1.0 LAM</span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">On-Device Hardware-Coupled Action Agent</p>
          </div>
        </div>

        {/* Central Navigation Switcher */}
        <div className="flex items-center bg-black/60 border border-neuro-border rounded-xl p-0.5 text-xs font-mono">
          <button
            onClick={() => { setActivePage('dashboard'); triggerHaptic('click'); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              activePage === 'dashboard' ? 'bg-neuro-neon text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => { setActivePage('mirror'); triggerHaptic('click'); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              activePage === 'mirror' ? 'bg-cyan-400 text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cast className="w-3.5 h-3.5" />
            <span>Mirror</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block"></span>
          </button>
        </div>

        {/* Telemetry Pills & Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 bg-neuro-card border border-neuro-border px-2 py-1 rounded-lg text-[11px] font-mono">
            <div className="flex items-center gap-1 text-gray-300">
              <Zap className={`w-3 h-3 ${isCharging ? 'text-yellow-400 animate-bounce' : 'text-gray-400'}`} />
              <span>{batteryLevel !== null ? `${batteryLevel}%` : '85%'}</span>
            </div>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1 text-gray-300">
              <Flame className={`w-3 h-3 ${temperature > 40 ? 'text-red-400 animate-pulse' : 'text-neuro-orange'}`} />
              <span>{temperature}°C</span>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-neuro-card border border-neuro-border rounded-lg p-0.5 text-xs">
            <button
              onClick={() => { setDeviceView('mobile'); triggerHaptic('click'); }}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${deviceView === 'mobile' ? 'bg-neuro-neon text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setDeviceView('desktop'); triggerHaptic('click'); }}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${deviceView === 'desktop' ? 'bg-neuro-neon text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleMonsterMode}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              monsterMode ? 'bg-neuro-orange text-black font-extrabold neon-glow-orange scale-105' : 'bg-neuro-card border border-neuro-border text-gray-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{monsterMode ? 'Monster ON' : 'Eco'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
