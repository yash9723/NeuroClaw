import React, { useState } from 'react';
import { ArrowLeft, Home, Square, Power, SunMedium, Volume2, Volume1, Send, Sparkles, Settings, Globe } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';
import { sendKey, sendText, sendAction } from '../services/deviceControl';

export default function PhoneControlBar({ onRefresh }) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleKey = async (key) => {
    triggerHaptic('click');
    await sendKey(key).catch(() => {});
    setTimeout(onRefresh, 300);
  };

  const handleAction = async (action) => {
    triggerHaptic('click');
    await sendAction(action).catch(() => {});
    setTimeout(onRefresh, 400);
  };

  const handleSendText = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    setIsSending(true);
    triggerHaptic('click');
    await sendText(inputText.trim()).catch(() => {});
    setInputText('');
    setIsSending(false);
    setTimeout(onRefresh, 300);
  };

  return (
    <div className="glass-panel p-3.5 rounded-2xl border border-neuro-border bg-[#070A10] space-y-3 font-mono text-xs max-w-lg w-full">
      {/* Remote Keyboard & Typing Bar */}
      <form onSubmit={handleSendText} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type text to inject to phone..."
          className="flex-1 bg-black/70 border border-neuro-border rounded-xl px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-neuro-neon placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={isSending || !inputText.trim()}
          className="bg-neuro-neon hover:bg-cyan-300 disabled:opacity-40 text-black font-sans font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inject</span>
        </button>
      </form>

      {/* Hardware Navigation & System Keys */}
      <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-neuro-border/60">
        <button onClick={() => handleKey('back')} title="Back" className="ctrl-btn">
          <ArrowLeft className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[10px]">Back</span>
        </button>
        <button onClick={() => handleKey('home')} title="Home" className="ctrl-btn">
          <Home className="w-3.5 h-3.5 text-neuro-orange" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => handleKey('recents')} title="Recent Apps" className="ctrl-btn">
          <Square className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px]">Recents</span>
        </button>
        <button onClick={() => handleKey('wake')} title="Wake Screen" className="ctrl-btn">
          <SunMedium className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px]">Wake</span>
        </button>
        <button onClick={() => handleKey('power')} title="Power" className="ctrl-btn">
          <Power className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px]">Power</span>
        </button>
      </div>

      {/* Quick Shortcuts: Volume & Quick App Launchers */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-neuro-border/40 text-[10px]">
        <div className="flex gap-1">
          <button onClick={() => handleKey('volume_up')} className="px-2 py-1 rounded bg-black/60 border border-neuro-border hover:border-gray-400 flex items-center gap-1 text-gray-300">
            <Volume2 className="w-3 h-3 text-cyan-400" /> +Vol
          </button>
          <button onClick={() => handleKey('volume_down')} className="px-2 py-1 rounded bg-black/60 border border-neuro-border hover:border-gray-400 flex items-center gap-1 text-gray-300">
            <Volume1 className="w-3 h-3 text-cyan-400" /> -Vol
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleAction('launch_app')} className="px-2 py-1 rounded bg-neuro-orange/20 border border-neuro-orange/40 text-neuro-orange hover:bg-neuro-orange/30 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> NeuroClaw
          </button>
          <button onClick={() => handleAction('settings')} className="px-2 py-1 rounded bg-black/60 border border-neuro-border text-gray-300 hover:text-white flex items-center gap-1">
            <Settings className="w-3 h-3" /> Settings
          </button>
          <button onClick={() => handleAction('browser')} className="px-2 py-1 rounded bg-black/60 border border-neuro-border text-gray-300 hover:text-white flex items-center gap-1">
            <Globe className="w-3 h-3" /> Web
          </button>
        </div>
      </div>
    </div>
  );
}
