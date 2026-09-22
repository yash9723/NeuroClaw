import React, { useState } from 'react';
import { Play, Mic, CheckCircle, ArrowRight, ShieldCheck, Clock, Layers } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { startVoiceRecognition, isSpeechSupported } from '../services/speech';

export default function TaskAutomator({ 
  scenarios, 
  activeScenario, 
  setActiveScenario,
  isExecuting,
  currentStepIndex,
  onStartExecution,
  onCustomPrompt,
  authStatus
}) {
  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    if (isListening) return;

    triggerHaptic('monsterPulse');
    setIsListening(true);

    startVoiceRecognition(
      (transcript) => {
        setCustomInput(transcript);
        setIsListening(false);
        triggerHaptic('click');
        onCustomPrompt(transcript);
      },
      (error) => {
        console.warn('Voice error:', error);
        setIsListening(false);
        triggerHaptic('error');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    triggerHaptic('click');
    onCustomPrompt(customInput);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-neuro-border">
      {/* Title & Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neuro-orange" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Autonomous Action Workflows
          </h2>
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          {isExecuting ? 'Agent Active' : 'Ready for Execution'}
        </span>
      </div>

      {/* Voice & Prompt Input Bar */}
      <form onSubmit={handleCustomSubmit} className="relative flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={isExecuting}
            placeholder="Type or speak a task e.g. 'Order milk from Blinkit'..."
            className="w-full bg-neuro-dark/90 border border-neuro-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neuro-neon transition pr-10 font-mono disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={isExecuting || !isSpeechSupported()}
            title="Speak Voice Command"
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'text-gray-400 hover:text-neuro-neon hover:bg-neuro-card'
            } disabled:opacity-40`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={isExecuting || !customInput.trim()}
          className="bg-neuro-neon text-black font-bold text-xs px-3.5 py-2.5 rounded-xl transition hover:brightness-110 disabled:opacity-40 active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <span>Run</span>
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </form>

      {/* 3 Pre-Packaged Winning Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
        {scenarios.map((sc) => {
          const isSelected = activeScenario?.id === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                if (isExecuting) return;
                setActiveScenario(sc);
                triggerHaptic('click');
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 relative ${
                isSelected
                  ? 'bg-neuro-card border-neuro-orange shadow-lg shadow-neuro-orange/15 ring-1 ring-neuro-orange/40'
                  : 'bg-neuro-dark/70 border-neuro-border/70 hover:border-gray-600'
              } ${isExecuting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white pr-1">{sc.title}</span>
                {sc.sensitive && (
                  <span className="flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-400" /> Bio-Guard
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2 mb-2.5 font-mono">
                {sc.prompt}
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-800/60">
                <div className="flex gap-1 flex-wrap">
                  {sc.targetApps.map((app) => (
                    <span key={app} className="bg-neuro-border/60 px-1.5 py-0.5 rounded text-gray-300 text-[9px]">
                      {app}
                    </span>
                  ))}
                </div>
                
                {/* 1-Tap Direct Run CTA */}
                {!isExecuting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveScenario(sc);
                      setTimeout(() => {
                        onStartExecution();
                      }, 50);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neuro-orange/20 hover:bg-neuro-orange text-neuro-orange hover:text-black border border-neuro-orange/40 text-[10px] font-bold font-sans transition active:scale-95 ml-2"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Run</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Workflow Execution Progress */}
      {activeScenario && (
        <div className="bg-neuro-dark/90 rounded-xl p-3.5 border border-neuro-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-gray-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-gray-500 block">Selected Pipeline</span>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>{activeScenario.title}</span>
                <ArrowRight className="w-3 h-3 text-neuro-neon" />
                <span className="text-neuro-neon text-[11px] font-mono">{activeScenario.prompt}</span>
              </h4>
            </div>

            {!isExecuting ? (
              <button
                onClick={onStartExecution}
                className="bg-gradient-to-r from-neuro-orange to-yellow-500 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-neuro-orange/20 whitespace-nowrap self-stretch sm:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute on Device</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-neuro-orange bg-neuro-orange/10 px-3 py-1.5 rounded-lg border border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange animate-ping" />
                <span>Executing Step {currentStepIndex + 1}/{activeScenario.steps.length}...</span>
              </div>
            )}
          </div>

          {/* Stepper Visualization */}
          <div className="space-y-2 mt-2">
            {activeScenario.steps.map((step, idx) => {
              const isDone = isExecuting ? currentStepIndex > idx : false;
              const isCurrent = isExecuting && currentStepIndex === idx;

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                    isCurrent
                      ? 'bg-neuro-card border-neuro-neon shadow-md shadow-neuro-neon/10'
                      : isDone
                      ? 'bg-neuro-dark/60 border-emerald-500/30'
                      : 'bg-neuro-dark/40 border-neuro-border/40 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-black'
                        : isCurrent
                        ? 'bg-neuro-neon text-black animate-pulse'
                        : 'bg-neuro-border text-gray-400'
                    }`}>
                      {isDone ? <CheckCircle className="w-3 h-3" /> : step.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{step.title}</span>
                        {step.isAuthGate && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                            HITL Gate
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{step.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{step.npuLatency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
