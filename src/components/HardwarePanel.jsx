// Hardware Telemetry & On-Device Sensor Dashboard
// Ponytail: <=120 lines, native DeviceOrientation, DeviceMotion, Haptics

import React, { useState, useEffect } from 'react';
import { Cpu, SmartphoneCharging, Compass, ShieldCheck, Thermometer, Camera, Mic } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export default function HardwarePanel({ monsterMode, temperature }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeHaptic, setActiveHaptic] = useState(null);
  const [shaken, setShaken] = useState(false);
  const [camStatus, setCamStatus] = useState('Cam');
  const [micStatus, setMicStatus] = useState('Mic');

  useEffect(() => {
    const onOrient = (e) => (e.gamma !== null && e.beta !== null) && setTilt({ x: Math.round(e.gamma), y: Math.round(e.beta) });
    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (a && Math.sqrt((a.x || 0)**2 + (a.y || 0)**2 + (a.z || 0)**2) > 24) {
        setShaken(true);
        triggerHaptic('monsterPulse');
        setTimeout(() => setShaken(false), 1500);
      }
    };
    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('devicemotion', onMotion);
    return () => {
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('devicemotion', onMotion);
    };
  }, []);

  const testHaptic = (n) => { triggerHaptic(n); setActiveHaptic(n); setTimeout(() => setActiveHaptic(null), 800); };
  const testCam = () => {
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then((s) => { setCamStatus('Cam: OK'); triggerHaptic('stepTick'); setTimeout(() => { s.getTracks().forEach(t => t.stop()); setCamStatus('Cam'); }, 2000); })
      .catch(() => { setCamStatus('Cam: Err'); setTimeout(() => setCamStatus('Cam'), 2000); });
  };
  const testMic = () => {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((s) => { setMicStatus('Mic: OK'); triggerHaptic('stepTick'); setTimeout(() => { s.getTracks().forEach(t => t.stop()); setMicStatus('Mic'); }, 2000); })
      .catch(() => { setMicStatus('Mic: Err'); setTimeout(() => setMicStatus('Mic'), 2000); });
  };

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-neuro-border space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-neuro-border/60">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-neuro-neon" />
          <span>Hardware & Sensor Telemetry</span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neuro-neon/10 text-neuro-neon border border-neuro-neon/30">
          NPU INT4 Active
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-neuro-dark/80 p-2 rounded-xl border border-neuro-border/60">
          <span className="text-gray-400 text-[9px] block">NPU Speed</span>
          <span className={`text-sm font-bold ${monsterMode ? 'text-neuro-orange' : 'text-gray-200'}`}>
            {monsterMode ? '45 TOPS' : '18 TOPS'}
          </span>
          <span className="text-[9px] text-gray-500 block">Hexagon NPU</span>
        </div>
        <div className="bg-neuro-dark/80 p-2 rounded-xl border border-neuro-border/60">
          <span className="text-gray-400 text-[9px] block">VC Thermal</span>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-neuro-orange" />
            <span className="text-sm font-bold text-gray-200">{temperature}°C</span>
          </div>
          <span className="text-[9px] text-emerald-400 block">Safe Tier</span>
        </div>
        <div className={`p-2 rounded-xl border transition-all ${shaken ? 'bg-neuro-orange/20 border-neuro-orange' : 'bg-neuro-dark/80 border-neuro-border/60'}`}>
          <span className="text-gray-400 text-[9px] block">Hardware Gyro</span>
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-neuro-neon" />
            <span className="text-xs font-bold text-gray-200">X:{tilt.x}° Y:{tilt.y}°</span>
          </div>
          <span className={`text-[9px] block ${shaken ? 'text-neuro-orange font-bold' : 'text-gray-500'}`}>
            {shaken ? 'SHAKE DETECTED!' : 'Shake-Ready'}
          </span>
        </div>
        <div className="bg-neuro-dark/80 p-2 rounded-xl border border-neuro-border/60">
          <span className="text-gray-400 text-[9px] block">Security Guard</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Bio HITL</span>
          </div>
          <span className="text-[9px] text-gray-500 block">Zero-Trust</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-neuro-border/60 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <button onClick={testCam} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${camStatus.includes('OK') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'text-gray-400 border-neuro-border hover:text-white'}`}>
            <Camera className="w-3 h-3" /> {camStatus}
          </button>
          <button onClick={testMic} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${micStatus.includes('OK') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'text-gray-400 border-neuro-border hover:text-white'}`}>
            <Mic className="w-3 h-3" /> {micStatus}
          </button>
          <span className="flex items-center gap-1 text-neuro-neon"><SmartphoneCharging className="w-3 h-3" /> Haptics</span>
        </div>
        <div className="flex items-center gap-1">
          {['monsterPulse', 'authChallenge', 'taskComplete'].map((pat) => (
            <button key={pat} onClick={() => testHaptic(pat)} className={`px-2 py-0.5 rounded font-bold transition-all text-[9px] ${activeHaptic === pat ? 'bg-neuro-neon text-black scale-95' : 'bg-neuro-card hover:bg-neuro-border text-gray-300 border border-neuro-border'}`}>
              {pat === 'monsterPulse' ? 'Pulse' : pat === 'authChallenge' ? 'Alert' : 'Kick'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

