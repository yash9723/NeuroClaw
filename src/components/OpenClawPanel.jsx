// OpenClaw Tool Registry Panel — Desktop Command Center & Real-Time Bus
// Shows 5 declared tools, live WebSocket stream, manual fire buttons
// Ponytail: <=120 lines, zero npm dependencies

import React, { useState, useEffect } from 'react';
import { Zap, Eye, Fingerprint, Cpu, RefreshCw, ChevronRight, Terminal } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';
import { subscribeRealtime } from '../services/realtime';

const TOOLS = [
  { id: 'inspect_screen',         icon: Eye,         label: 'Inspect Screen',   color: 'text-neuro-neon border-neuro-neon/40 bg-neuro-neon/10',   defaultParams: { focus_app: 'com.neuroclaw.agent' } },
  { id: 'synthesize_touch',       icon: Zap,         label: 'Synthesize Touch', color: 'text-neuro-orange border-neuro-orange/40 bg-neuro-orange/10', defaultParams: { action_type: 'tap', coordinates: { x: 540, y: 960 } } },
  { id: 'trigger_biometric_gate', icon: Fingerprint, label: 'Biometric Gate',   color: 'text-amber-400 border-amber-400/40 bg-amber-400/10',     defaultParams: { task_description: 'Manual demo gate', risk_level: 'MEDIUM' } },
  { id: 'set_hardware_profile',   icon: Cpu,         label: 'Hardware Profile', color: 'text-purple-400 border-purple-400/40 bg-purple-400/10',   defaultParams: { profile: 'MONSTER_PERFORMANCE' } },
  { id: 'desktop_action',         icon: Terminal,    label: 'Desktop Action',   color: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',         defaultParams: { action: 'git_status' } },
];

export default function OpenClawPanel({ isExecuting }) {
  const [trace, setTrace] = useState([]);
  const [firing, setFiring] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/openclaw/tool_trace'))
      .then(r => r.json())
      .then(d => setTrace(d.trace || []))
      .catch(() => {});

    const unsubscribe = subscribeRealtime((msg) => {
      if (msg.type === 'connection') setConnected(msg.status === 'connected');
      if (msg.type === 'init' && msg.tool_trace) setTrace(msg.tool_trace);
      if (msg.type === 'tool_call' && msg.data) {
        setTrace((prev) => [...prev, msg.data]);
      }
      if (msg.type === 'tool_trace_cleared') setTrace([]);
    });
    return unsubscribe;
  }, []);

  const fireTool = async (tool) => {
    setFiring(tool.id);
    triggerHaptic('click');
    try {
      await fetch(apiUrl('/api/openclaw/execute_step'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tool.id, params: tool.defaultParams })
      });
    } catch (_) {}
    setFiring(null);
  };

  const clearTrace = async () => {
    await fetch(apiUrl('/api/openclaw/tool_trace'), { method: 'DELETE' }).catch(() => {});
    setTrace([]);
  };

  return (
    <div className="glass-panel rounded-2xl border border-neuro-border bg-[#0B0F19]/90 p-3.5 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-neuro-border/60">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-neuro-neon animate-pulse' : 'bg-neuro-orange'}`} />
          <span className="font-bold text-white text-[11px] uppercase tracking-wider">OpenClaw Tools</span>
          <span className="text-[9px] text-gray-500 font-sans">{connected ? 'Live WS' : 'Polling'}</span>
        </div>
        <button onClick={clearTrace} title="Clear trace" className="text-gray-500 hover:text-white transition">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((tool, idx) => {
          const Icon = tool.icon;
          const lastCall = [...trace].reverse().find((t) => t.tool === tool.id);
          const isSpan = idx === TOOLS.length - 1 && TOOLS.length % 2 === 1;
          return (
            <button
              key={tool.id}
              onClick={() => fireTool(tool)}
              disabled={!!firing}
              className={`relative flex flex-col items-start gap-1 p-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${tool.color} ${firing === tool.id ? 'opacity-60' : ''} ${isSpan ? 'col-span-2' : ''}`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Icon className="w-3 h-3 shrink-0" />
                <span className="font-bold text-[10px] leading-tight">{tool.label}</span>
                {firing === tool.id && <RefreshCw className="w-2.5 h-2.5 animate-spin ml-auto" />}
                {lastCall && firing !== tool.id && <ChevronRight className="w-2.5 h-2.5 ml-auto opacity-60" />}
              </div>
              <span className="text-[8px] opacity-75 leading-none truncate w-full text-left">
                {lastCall ? `✓ last: ${new Date(lastCall.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'tap to fire'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1 max-h-28 overflow-y-auto">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Live Call Stream ({trace.length})</span>
        {trace.length === 0 ? (
          <p className="text-[10px] text-gray-600 italic">Run a scenario or tap a tool above.</p>
        ) : (
          [...trace].reverse().slice(0, 5).map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] bg-black/30 px-2 py-1 rounded-lg border border-neuro-border/40">
              <span className={`font-bold text-[9px] px-1 rounded ${t.status === 'ok' ? 'text-neuro-neon' : 'text-red-400'}`}>
                {t.tool?.replace('_', ' ')}
              </span>
              <span className="text-gray-400 truncate text-[9px]">
                {JSON.stringify(t.output || t.params).slice(0, 42)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
