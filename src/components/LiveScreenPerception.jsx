import React, { useState, useEffect } from 'react';
import { Eye, Touchpad, Crosshair, CheckCircle2, ShoppingBag, Mail, MessageSquare, Terminal } from 'lucide-react';

export default function LiveScreenPerception({ activeScenario, currentStepIndex, isExecuting }) {
  const [touchCoords, setTouchCoords] = useState({ x: 50, y: 50 });
  const [pulseActive, setPulseActive] = useState(false);

  // Trigger simulated touch pulse whenever step changes
  useEffect(() => {
    if (!isExecuting || !activeScenario) return;

    // Generate dynamic touch coordinates based on step
    const randomOffsets = [
      { x: 50, y: 25 },
      { x: 75, y: 65 },
      { x: 50, y: 50 },
      { x: 82, y: 88 },
      { x: 60, y: 40 },
    ];
    const target = randomOffsets[currentStepIndex % randomOffsets.length];
    setTouchCoords(target);
    setPulseActive(true);

    const timer = setTimeout(() => setPulseActive(false), 900);
    return () => clearTimeout(timer);
  }, [currentStepIndex, isExecuting, activeScenario]);

  if (!activeScenario) return null;

  const currentStep = activeScenario.steps[currentStepIndex] || activeScenario.steps[0];
  
  // Dynamically resolve the active app on screen based on the current step
  let appType = activeScenario.targetApps[0] || 'System';
  const stepText = ` ${currentStep?.title || ''} ${currentStep?.detail || ''} `.toLowerCase();
  
  if (/\bwhatsapp\b/.test(stepText)) {
    appType = 'WhatsApp';
  } else if (/\b(google pay|gpay|upi|pay|checkout)\b/.test(stepText) && !/\b(deploy)\b/.test(stepText)) {
    appType = 'Google Pay';
  } else if (/\b(github|pull request|\bpr\b|commit)\b/.test(stepText)) {
    appType = 'GitHub';
  } else if (/\b(termux|container|502|docker|bash)\b/.test(stepText)) {
    appType = 'Termux';
  } else if (/\b(blinkit|cart|order tracking|milk)\b/.test(stepText)) {
    appType = 'Blinkit';
  } else if (/\b(gmail|email|inbox)\b/.test(stepText)) {
    appType = 'Gmail';
  }

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-neuro-border relative overflow-hidden">
      {/* Perception Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-neuro-border/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neuro-neon/20 border border-neuro-neon/40 flex items-center justify-center text-neuro-neon">
            <Eye className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span>Live Screen Perception & Touch Synthesizer</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                120 FPS
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-gray-400">
          <span className="flex items-center gap-1 text-neuro-orange">
            <Crosshair className="w-3 h-3" />
            <span>X:{touchCoords.x}% Y:{touchCoords.y}%</span>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-neuro-neon uppercase font-bold">{appType}</span>
        </div>
      </div>

      {/* Simulated App Screen Viewport */}
      <div className="relative w-full h-44 sm:h-48 rounded-xl bg-[#070A0F] border border-neuro-border/80 overflow-hidden flex flex-col justify-between p-3 font-mono">
        
        {/* Mock App Screen Content depending on Target App */}
        {appType === 'Gmail' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-red-400 font-bold"><Mail className="w-3 h-3" /> INBOX (1 unread)</span>
              <span>10:24 AM</span>
            </div>
            <div className="p-2 rounded bg-gray-900/90 border border-gray-800 text-[11px]">
              <div className="font-bold text-white truncate">Client Urgent: Critical Server Memory Leak</div>
              <p className="text-gray-400 text-[10px] truncate mt-0.5">Please approve deployment v2.4.0 before 11 AM...</p>
            </div>
            <div className="flex items-center justify-between pt-1 text-[9px] text-gray-500">
              <span className="p-1 rounded bg-neuro-border/40 border border-dashed border-neuro-neon/40 text-neuro-neon">
                [OCR Target: Extract Text]
              </span>
              <span className="text-emerald-400">Status: Parsed</span>
            </div>
          </div>
        )}

        {appType === 'WhatsApp' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold"><MessageSquare className="w-3 h-3" /> Core Dev Team</span>
              <span>Online</span>
            </div>
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-[11px] self-end max-w-[88%] ml-auto text-right">
              <span className="text-emerald-200">"Server memory leak fixed. Ready for release 2.4.0 deploy approval."</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Dispatched via NeuroClaw ✓✓</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[9px]">
              <span className="text-gray-500 font-mono">End-to-End Encrypted</span>
              <span className="px-2 py-0.5 rounded-full bg-neuro-orange/20 text-neuro-orange border border-neuro-orange/50 animate-pulse">
                [OCR Target: Send Button]
              </span>
            </div>
          </div>
        )}

        {appType === 'Blinkit' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-yellow-400 font-bold"><ShoppingBag className="w-3 h-3" /> Blinkit Delivery</span>
              <span>Cart: 1 Item</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-900/90 border border-gray-800 text-[11px]">
              <div>
                <div className="font-bold text-white">Amul Taaza Toned Milk 1L</div>
                <div className="text-neuro-neon text-[10px]">₹68.00</div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] border border-emerald-400">
                ADDED ✓
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-dashed border-amber-500/40">
                [OCR Target: Checkout & Pay ₹68.00]
              </span>
              <span className="text-gray-400 font-mono">Routing to UPI Gate</span>
            </div>
          </div>
        )}

        {appType === 'Google Pay' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-blue-400 font-bold">💳 Google Pay UPI</span>
              <span className="text-emerald-400 font-bold">Verified Merchant</span>
            </div>
            <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/40 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Paying Blinkit India</span>
                <span className="font-bold text-lg text-white">₹68.00</span>
              </div>
              <p className="text-blue-300 text-[9px] mt-1">Zero-Trust Hardware Token Attached</p>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ✓ Biometric Gate Authenticated
              </span>
              <span className="text-gray-400 font-mono">UPI Ref #83921</span>
            </div>
          </div>
        )}

        {appType === 'Termux' && (
          <div className="space-y-1.5 font-mono text-[10px] text-gray-300">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <Terminal className="w-3 h-3" /> <span>bash: /staging/logs/deploy.log</span>
            </div>
            <div className="text-red-400">[ERROR 502]: DB connection pool timeout at line 44</div>
            <div className="text-gray-400">→ Synthesizing release lock patch...</div>
            <div className="text-neuro-neon">→ Git commit -m "fix(db): add release() guard"</div>
          </div>
        )}

        {appType === 'GitHub' && (
          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-gray-400">
              <span className="flex items-center gap-1 text-purple-400 font-bold">🐙 GitHub Actions</span>
              <span className="text-emerald-400 font-bold">CI: 3/3 Passed ✓</span>
            </div>
            <div className="p-2 rounded bg-purple-950/30 border border-purple-800/40">
              <div className="font-bold text-white">PR #142: fix(db): release connection lock</div>
              <div className="text-gray-400 text-[9px] mt-0.5">Branch: staging-hotfix-502 → main</div>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Auto-Merged Successfully
              </span>
              <span className="text-gray-500">SHA: 7a91f4c</span>
            </div>
          </div>
        )}

        {/* Dynamic Touch Radar Ripple Overlay */}
        {isExecuting && pulseActive && (
          <div 
            className="absolute pointer-events-none transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${touchCoords.x}%`, top: `${touchCoords.y}%` }}
          >
            <div className="w-10 h-10 rounded-full border-2 border-neuro-orange bg-neuro-orange/30 animate-ping"></div>
            <div className="w-4 h-4 rounded-full bg-neuro-orange border border-white absolute top-3 left-3 shadow-lg"></div>
          </div>
        )}

        {/* Viewport Live Action Badge */}
        <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <span className="w-1.5 h-1.5 rounded-full bg-neuro-neon animate-ping"></span>
            <span className="text-white truncate font-medium">{currentStep.detail}</span>
          </div>
          <span className="text-gray-500 whitespace-nowrap">NPU: {currentStep.npuLatency}</span>
        </div>
      </div>
    </div>
  );
}
