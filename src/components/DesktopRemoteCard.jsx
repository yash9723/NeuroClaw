// Desktop Remote Controller for OpenClaw (Mobile View)
// Allows phone app to remotely control desktop OS & dispatch OpenClaw tasks
// Ponytail: <=120 lines, mobile-first, native APIs

import React, { useState, useEffect } from 'react';
import { Monitor, Lock, Code2, Globe, GitBranch, Play, Terminal, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { apiUrl } from '../services/bridge';

const QUICK_ACTIONS = [
  { id: 'lock_pc',       label: 'Lock PC',    icon: Lock,      color: 'text-amber-400 border-amber-400/40 bg-amber-400/10' },
  { id: 'launch_vscode', label: 'VS Code',    icon: Code2,     color: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
  { id: 'launch_browser',label: 'Browser',    icon: Globe,     color: 'text-neuro-neon border-neuro-neon/40 bg-neuro-neon/10' },
  { id: 'git_status',    label: 'Git Status', icon: GitBranch, color: 'text-purple-400 border-purple-400/40 bg-purple-400/10' },
  { id: 'build_project', label: 'Build',      icon: Zap,       color: 'text-neuro-orange border-neuro-orange/40 bg-neuro-orange/10' },
];

export default function DesktopRemoteCard() {
  const [desktopStatus, setDesktopStatus] = useState({ status: 'online', hostname: 'PC', os: 'Windows' });
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl('/api/desktop/status'));
      if (res.ok) setDesktopStatus(await res.json());
    } catch (_) {
      setDesktopStatus({ status: 'offline', hostname: 'Desktop', os: 'Windows' });
    }
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 5000);
    return () => clearInterval(iv);
  }, []);

  const sendAction = async (actionId) => {
    setLoading(true);
    triggerHaptic('click');
    try {
      const res = await fetch(apiUrl('/api/desktop/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId })
      });
      const data = await res.json();
      setOutput(`[${actionId.toUpperCase()}] ${data.message || 'Action executed on desktop.'}`);
      triggerHaptic('taskComplete');
    } catch (e) {
      setOutput(`[ERROR] Failed to reach desktop: ${e.message}`);
    }
    setLoading(false);
  };

  const dispatchPrompt = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    triggerHaptic('monsterPulse');
    const task = prompt.trim();
    setPrompt('');
    try {
      const res = await fetch(apiUrl('/api/desktop/openclaw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: task })
      });
      const data = await res.json();
      setOutput(`[OPENCLAW DESKTOP] ${data.output?.output || data.output?.message || JSON.stringify(data.output)}`);
      triggerHaptic('taskComplete');
    } catch (e) {
      setOutput(`[ERROR] Desktop OpenClaw dispatch failed: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-3 border border-neuro-border bg-[#0B0F19]/90 space-y-2.5 font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-neuro-border/60">
        <div className="flex items-center gap-1.5 text-white font-bold text-[11px] uppercase tracking-wider">
          <Monitor className="w-3.5 h-3.5 text-neuro-neon" />
          <span>Desktop Remote Control</span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${desktopStatus.status === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {desktopStatus.status === 'online' ? `🖥️ ${desktopStatus.hostname}` : '⚠️ Offline'}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => sendAction(a.id)}
              disabled={loading}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-transform active:scale-95 ${a.color}`}
            >
              <Icon className="w-3.5 h-3.5 mb-1 shrink-0" />
              <span className="text-[8px] font-sans font-bold leading-none">{a.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={dispatchPrompt} className="flex gap-1.5">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Desktop goal: e.g. git status, lock pc, build..."
          className="flex-1 bg-black/60 border border-neuro-border rounded-lg px-2.5 py-1 text-white text-[10px] focus:outline-none focus:border-neuro-neon"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-neuro-orange hover:bg-amber-400 text-black font-sans font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shrink-0 transition"
        >
          {loading ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
          <span>Send</span>
        </button>
      </form>

      {output && (
        <div className="bg-[#05070A] p-2 rounded-xl border border-neuro-border/60 text-[10px] text-emerald-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}
