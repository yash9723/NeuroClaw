import React, { useState, useRef } from 'react';
import { RefreshCw, Smartphone, Zap } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { sendTap, sendSwipe } from '../services/deviceControl';

export default function PhoneInteractiveCanvas({ screencapUrl, displayInfo, onRefresh, loading }) {
  const [touchRipple, setTouchRipple] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y, time: Date.now() });
  };

  const handlePointerUp = async (e) => {
    if (!dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dx = endX - dragStart.x;
    const dy = endY - dragStart.y;
    const dist = Math.hypot(dx, dy);

    triggerHaptic('click');

    if (dist > 25) {
      // Recognized as swipe/gesture
      const w = displayInfo?.width || 1080;
      const h = displayInfo?.height || 2400;
      const x1 = Math.round((dragStart.x / rect.width) * w);
      const y1 = Math.round((dragStart.y / rect.height) * h);
      const x2 = Math.round((endX / rect.width) * w);
      const y2 = Math.round((endY / rect.height) * h);
      await sendSwipe({ x1, y1, x2, y2, duration_ms: 220 }).catch(() => {});
    } else {
      // Recognized as single tap
      const pct_x = Math.max(0, Math.min(1, endX / rect.width));
      const pct_y = Math.max(0, Math.min(1, endY / rect.height));
      setTouchRipple({ x: pct_x * 100, y: pct_y * 100, id: Date.now() });
      setTimeout(() => setTouchRipple(null), 450);
      await sendTap({ pct_x, pct_y }).catch(() => {});
    }

    setDragStart(null);
    setTimeout(onRefresh, 300);
  };

  return (
    <div className="relative mx-auto flex flex-col items-center select-none font-mono">
      {/* Phone Hardware Bezel */}
      <div className="relative w-[280px] sm:w-[320px] md:w-[350px] aspect-[9/19.5] bg-[#0A0D14] p-3 rounded-[42px] border-4 border-[#222B3D] shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,200,0.1)] transition-all">
        {/* Dynamic Punch Hole Camera */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-gray-800 z-30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-[#001b2e] rounded-full"></div>
        </div>

        {/* Screen Viewport & Touch Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="relative w-full h-full rounded-[32px] overflow-hidden bg-black cursor-crosshair border border-white/10"
        >
          {screencapUrl ? (
            <img
              src={screencapUrl}
              alt="Connected Phone Screen"
              className="w-full h-full object-fill pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
              <Smartphone className="w-10 h-10 animate-pulse text-neuro-neon" />
              <span className="text-xs">Waiting for Screen Stream...</span>
            </div>
          )}

          {/* Animated Touch Ripple */}
          {touchRipple && (
            <span
              style={{ left: `${touchRipple.x}%`, top: `${touchRipple.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neuro-neon/50 border-2 border-neuro-neon pointer-events-none animate-ping"
            />
          )}

          {/* Quick HUD Overlay */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center text-[9px] px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-gray-300 pointer-events-none">
            <span className="flex items-center gap-1 text-neuro-neon font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {displayInfo ? `${displayInfo.width}x${displayInfo.height}` : '1080x2400'}
            </span>
            <span className="text-gray-400">Touch & Drag Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
