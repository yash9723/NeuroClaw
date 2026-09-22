import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';

const TOOL_COLORS = {
  inspect_screen:        'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  synthesize_touch:      'bg-neuro-orange/20 text-neuro-orange border-neuro-orange/40',
  trigger_biometric_gate:'bg-amber-500/20 text-amber-300 border-amber-500/40',
  set_hardware_profile:  'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

export default function TelemetryDrawer({ logs, currentActionSchema, monsterMode, isExecuting }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toolTrace, setToolTrace] = useState([]);
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'trace'

  // Poll tool trace while executing
  useEffect(() => {
    if (!isExecuting) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(apiUrl('/api/openclaw/tool_trace'));
        if (r.ok) { const d = await r.json(); setToolTrace(d.trace || []); }
      } catch (_) {}
    }, 1000);
    return () => clearInterval(iv);
  }, [isExecuting]);

  const copyLogs = () => {
    triggerHaptic('click');
    navigator.clipboard?.writeText(JSON.stringify({ currentActionSchema, logs, toolTrace }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="glass-panel rounded-2xl border border-neuro-border overflow-hidden">
      <div
        onClick={() => { setIsExpanded(!isExpanded); triggerHaptic('click'); }}
        className="p-3 bg-neuro-dark/90 flex items-center justify-between cursor-pointer border-b border-neuro-border/60 hover:bg-neuro-card transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neuro-neon" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            OpenClaw Agent Trace & Telemetry Stream
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neuro-border text-gray-400">
            {logs.length} events
          </span>
          {toolTrace.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neuro-neon/20 text-neuro-neon border border-neuro-neon/40">
              {toolTrace.length} calls
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); copyLogs(); }}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-neuro-card hover:bg-neuro-border text-gray-300 transition">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Tab switcher */}
          <div className="flex gap-1 text-[10px] font-sans font-semibold">
            <button onClick={() => setActiveTab('schema')} className={`px-2 py-0.5 rounded ${activeTab === 'schema' ? 'bg-neuro-neon text-black' : 'text-gray-400 hover:text-white'}`}>Schema</button>
            <button onClick={() => setActiveTab('trace')} className={`px-2 py-0.5 rounded flex items-center gap-1 ${activeTab === 'trace' ? 'bg-neuro-orange text-black' : 'text-gray-400 hover:text-white'}`}>
              <Zap className="w-2.5 h-2.5" />Tool Trace {toolTrace.length > 0 && `(${toolTrace.length})`}
            </button>
            <button onClick={() => setActiveTab('logs')} className={`px-2 py-0.5 rounded ${activeTab === 'logs' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>Kernel</button>
          </div>

          {activeTab === 'schema' && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                <span className="flex items-center gap-1 text-neuro-orange"><Sparkles className="w-3 h-3" /> Live Tool-Calling Action Schema (OpenClaw)</span>
                <span>Protocol: OpenClaw LAM v1</span>
              </div>
              <pre className="bg-[#05070A] p-3 rounded-xl border border-neuro-border/60 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(currentActionSchema, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'trace' && (
            <div className="max-h-52 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
              {toolTrace.length === 0 ? (
                <div className="text-gray-600 italic text-[10px]">No tool calls yet — run a scenario to see live trace.</div>
              ) : toolTrace.map((t, i) => (
                <div key={i} className={`p-2 rounded-lg border ${TOOL_COLORS[t.tool] || 'bg-neuro-border/20 text-gray-300 border-neuro-border/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px]">{t.tool}</span>
                    <span className={`text-[9px] px-1 rounded ${t.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{t.status}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 truncate mt-0.5">{JSON.stringify(t.output).slice(0, 80)}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
              {logs.length === 0 ? (
                <div className="text-gray-600 italic text-[10px]">Awaiting agent action initiation...</div>
              ) : logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-300">
                  <span className="text-gray-500 text-[10px] whitespace-nowrap">[{log.time}]</span>
                  <span className={`px-1 rounded text-[10px] ${log.type === 'auth' ? 'bg-amber-500/20 text-amber-400' : log.type === 'action' ? 'bg-neuro-neon/20 text-neuro-neon' : 'bg-neuro-border text-gray-300'}`}>{log.type.toUpperCase()}</span>
                  <span className="text-gray-200">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
