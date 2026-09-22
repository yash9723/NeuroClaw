import React, { useState } from 'react';
import { Video, Award, Clock, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export default function VideoDemoHelper({ onStartSequence }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-4 border border-neuro-border/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neuro-orange/20 border border-neuro-orange/40 flex items-center justify-center text-neuro-orange">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Autonomous AI Model Hackathon Submission Helper
            </h3>
            <p className="text-[11px] text-gray-400">
              60-Second Walkthrough Video Script & Judging Rubric Checklist
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            triggerHaptic('click');
          }}
          className="px-3 py-1.5 rounded-xl bg-neuro-card hover:bg-neuro-border border border-neuro-border text-xs text-neuro-neon transition font-mono flex items-center gap-1"
        >
          <span>{isOpen ? 'Hide Checklist' : 'Show Walkthrough Guide'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-neuro-border/60 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-neuro-dark/80 p-2.5 rounded-xl border border-neuro-border">
              <span className="text-neuro-orange font-bold block mb-1">0:00 - 0:15 (The Pain)</span>
              <p className="text-gray-400">
                State the problem: Mobile AI assistants are passive chatbots. Repetitive cross-app workflows waste hours every day.
              </p>
            </div>
            <div className="bg-neuro-dark/80 p-2.5 rounded-xl border border-neuro-border">
              <span className="text-neuro-neon font-bold block mb-1">0:15 - 0:45 (The Live Demo)</span>
              <p className="text-gray-400">
                Trigger autonomous task via voice. Show the screen auto-navigating, then the Zero-Trust Face Auth popup, and post-auth completion.
              </p>
            </div>
            <div className="bg-neuro-dark/80 p-2.5 rounded-xl border border-neuro-border">
              <span className="text-emerald-400 font-bold block mb-1">0:45 - 1:00 (Hardware & NPU Value)</span>
              <p className="text-gray-400">
                Highlight Snapdragon NPU on-device INT4 efficiency, dual-axis linear haptics, and native Android ecosystem integration.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full documentation ready in <code className="text-neuro-neon">docs/SUBMISSION_PORTAL_CONTENT.md</code></span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('monsterPulse');
                onStartSequence?.();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-neuro-orange text-black font-bold text-xs hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-lg shadow-neuro-orange/20"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Launch 1-Click Video Recording Sequence</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
