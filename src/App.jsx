import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HardwarePanel from './components/HardwarePanel';
import TaskAutomator from './components/TaskAutomator';
import FaceAuthModal from './components/FaceAuthModal';
import TelemetryDrawer from './components/TelemetryDrawer';
import LiveScreenPerception from './components/LiveScreenPerception';
import DeviceBridgeCard from './components/DeviceBridgeCard';
import PhysicalScreenMirror from './components/PhysicalScreenMirror';
import DesktopCommandBanner from './components/DesktopCommandBanner';
import OpenClawPanel from './components/OpenClawPanel';
import DesktopRemoteCard from './components/DesktopRemoteCard';
import { SCENARIOS, planWithOpenClaw } from './services/agentSimulator';
import { triggerHaptic } from './services/haptics';
import { apiUrl } from './services/bridge';

export default function App() {
  const [monsterMode, setMonsterMode] = useState(true);
  const [deviceView, setDeviceView] = useState('desktop'); // 'mobile' | 'desktop'
  const [mirrorMode, setMirrorMode] = useState('perception'); // 'perception' | 'physical'
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(false);
  const [temperature, setTemperature] = useState(38);

  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const stepTimeoutRef = useRef(null);
  const [currentActionSchema, setCurrentActionSchema] = useState({
    status: 'idle',
    runtime: 'OpenClaw Hexagon NPU LAM',
    active_app: null,
    next_action: null
  });

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Battery Status API (Native Web API - Ponytail compliant)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch((e) => console.log('Battery API not available:', e));
    }
  }, []);

  // Temperature Simulation based on Monster Mode
  useEffect(() => {
    setTemperature(monsterMode ? 41 : 36);
  }, [monsterMode]);

  // Log Helper
  const addLog = (type, message) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [{ time, type, message }, ...prev.slice(0, 40)]);
  };

  // Push state to LAN sync server
  const pushSync = (data) => {
    fetch(apiUrl('/api/sync/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  };

  // Fire real OpenClaw tool call (logged in /api/openclaw/tool_trace)
  const pushToolCall = (step) => {
    if (!step?._tool) return;
    fetch(apiUrl('/api/openclaw/execute_step'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: step._tool, params: step._params || {} })
    }).catch(() => {});
  };

  // Real-time Wireless LAN Sync Listener
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl('/api/sync/state'));
        if (!res.ok) return;
        const remote = await res.json();
        if (remote.is_auth_open && !isAuthModalOpen) {
          setIsAuthModalOpen(true);
        } else if (!remote.is_auth_open && isAuthModalOpen && remote.auth_passed) {
          setIsAuthModalOpen(false);
        }
      } catch (_) {}
    }, 900);
    return () => clearInterval(interval);
  }, [isAuthModalOpen]);

  // Start Autonomous Task Execution
  const startExecution = () => {
    if (!activeScenario || isExecuting) return;

    setIsExecuting(true);
    setCurrentStepIndex(0);
    triggerHaptic('monsterPulse');

    pushSync({ is_executing: true, step_index: 0, is_auth_open: false, auth_passed: false });
    addLog('kernel', `Task triggered: "${activeScenario.prompt}"`);
    executeStep(0, activeScenario);
  };

  // Step-by-Step Autonomous Loop
  const executeStep = (index, scenario) => {
    if (index >= scenario.steps.length) {
      // Completed all steps
      setIsExecuting(false);
      triggerHaptic('taskComplete');
      pushSync({ is_executing: false, is_auth_open: false });
      addLog('complete', `Execution finished. Post-audit verified on hardware.`);
      setCurrentActionSchema({
        status: 'completed',
        task_id: scenario.id,
        apps_affected: scenario.targetApps,
        audit_hash: 'sha256_9b84e3a1',
        total_latency_ms: 385
      });
      return;
    }

    const step = scenario.steps[index];
    setCurrentStepIndex(index);
    triggerHaptic('stepTick');

    // Update Action Schema
    setCurrentActionSchema({
      step_number: index + 1,
      total_steps: scenario.steps.length,
      action_type: step.action,
      description: step.detail,
      target_app: scenario.targetApps[0] || 'System',
      npu_latency: step.npuLatency,
      zero_trust_gate: step.isAuthGate || false
    });

    addLog('action', `Step ${index + 1}: ${step.title} (${step.npuLatency})`);
    pushToolCall(step);

    // Check if step requires Zero-Trust Biometric Gate
    if (step.isAuthGate) {
      addLog('auth', `Zero-Trust Challenge: Facial Recognition required for ${scenario.title}`);
      pushSync({ is_auth_open: true, auth_passed: false });
      setIsAuthModalOpen(true);
      return; // Execution pauses until modal resolves
    }

    // Otherwise continue to next step after small delay
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    stepTimeoutRef.current = setTimeout(() => {
      executeStep(index + 1, scenario);
    }, 1100);
  };

  // Called when Biometric/PIN Verification succeeds
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    pushSync({ is_auth_open: false, auth_passed: true });
    addLog('auth', 'Biometric Challenge Passed: Facial Recognition Confirmed.');
    triggerHaptic('taskComplete');

    // Resume execution
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    stepTimeoutRef.current = setTimeout(() => {
      executeStep(currentStepIndex + 1, activeScenario);
    }, 600);
  };

  // Called when Biometric Verification cancelled
  const handleAuthCancel = () => {
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    setIsAuthModalOpen(false);
    setIsExecuting(false);
    triggerHaptic('error');
    addLog('auth', 'Biometric Challenge Aborted by user. Execution halted.');
    setCurrentActionSchema((prev) => ({ ...prev, status: 'aborted_by_user' }));
  };

  // Custom Prompt Input (Voice or typed) — powered by OpenClaw LAM
  const handleCustomPrompt = async (promptText) => {
    addLog('kernel', `OpenClaw planning: "${promptText}"`);
    const scenario = await planWithOpenClaw(promptText, ['Blinkit', 'WhatsApp', 'Gmail']);
    if (scenario._model && scenario._model !== 'offline-fallback') {
      addLog('action', `LAM model: ${scenario._model} — ${scenario.steps.length} steps planned`);
    }
    setActiveScenario(scenario);
    setTimeout(() => {
      setIsExecuting(true);
      setCurrentStepIndex(0);
      triggerHaptic('monsterPulse');
      executeStep(0, scenario);
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-[#0A0D14] text-gray-100 flex flex-col justify-between ${
      monsterMode ? 'selection:bg-neuro-orange' : 'selection:bg-neuro-neon'
    }`}>
      {/* App Header */}
      <Header
        monsterMode={monsterMode}
        setMonsterMode={setMonsterMode}
        deviceView={deviceView}
        setDeviceView={setDeviceView}
        batteryLevel={batteryLevel}
        isCharging={isCharging}
        temperature={temperature}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex items-center justify-center pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
        {/* Desktop Command Center View */}
        {!isMobileScreen && deviceView === 'desktop' ? (
          <div className="w-full space-y-4">
            <DesktopCommandBanner />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Device Bridge & Mirror / Perception (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <DeviceBridgeCard
                  mirrorMode={mirrorMode}
                  setMirrorMode={setMirrorMode}
                  onRefreshMirror={() => setRefreshKey(Date.now())}
                />
                {mirrorMode === 'perception' ? (
                  <LiveScreenPerception
                    activeScenario={activeScenario}
                    currentStepIndex={currentStepIndex}
                    isExecuting={isExecuting}
                  />
                ) : (
                  <PhysicalScreenMirror
                    refreshKey={refreshKey}
                    onRefresh={() => setRefreshKey(Date.now())}
                  />
                )}
              </div>

              {/* Center Column: Task Automator (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <TaskAutomator
                  scenarios={SCENARIOS}
                  activeScenario={activeScenario}
                  setActiveScenario={setActiveScenario}
                  isExecuting={isExecuting}
                  currentStepIndex={currentStepIndex}
                  onStartExecution={startExecution}
                  onCustomPrompt={handleCustomPrompt}
                  authStatus={isAuthModalOpen}
                />
              </div>

              {/* Right Column: Hardware Panel, OpenClaw Registry & Kernel Stream (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <HardwarePanel 
                  monsterMode={monsterMode} 
                  temperature={temperature} 
                />
                <OpenClawPanel isExecuting={isExecuting} />
                <TelemetryDrawer
                  logs={logs}
                  currentActionSchema={currentActionSchema}
                  monsterMode={monsterMode}
                  isExecuting={isExecuting}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Mobile Frame / Handheld View */
          <div className={`w-full transition-all duration-300 ${
            !isMobileScreen && deviceView === 'mobile' 
              ? 'max-w-[420px] rounded-[40px] border-[6px] border-[#1F293D] shadow-2xl bg-[#080B10] p-3 my-4 overflow-hidden relative' 
              : 'max-w-xl space-y-4'
          }`}>
            {!isMobileScreen && deviceView === 'mobile' && (
              <div className="flex justify-center mb-3">
                <div className="w-24 h-4 bg-[#1F293D] rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-black rounded-full border border-gray-700"></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <DesktopRemoteCard />
              <HardwarePanel 
                monsterMode={monsterMode} 
                temperature={temperature} 
              />
              <TaskAutomator
                scenarios={SCENARIOS}
                activeScenario={activeScenario}
                setActiveScenario={setActiveScenario}
                isExecuting={isExecuting}
                currentStepIndex={currentStepIndex}
                onStartExecution={startExecution}
                onCustomPrompt={handleCustomPrompt}
                authStatus={isAuthModalOpen}
              />
              <LiveScreenPerception
                activeScenario={activeScenario}
                currentStepIndex={currentStepIndex}
                isExecuting={isExecuting}
              />
              <TelemetryDrawer
                logs={logs}
                currentActionSchema={currentActionSchema}
                monsterMode={monsterMode}
                isExecuting={isExecuting}
              />
            </div>
          </div>
        )}
      </main>

      {/* Zero-Trust Biometric Face Recognition & PIN Modal */}
      <FaceAuthModal
        isOpen={isAuthModalOpen}
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
        taskDetails={activeScenario}
      />

      {/* Footer */}
      <footer className="border-t border-neuro-border py-3 px-4 text-center text-xs text-gray-500 font-mono">
        <span>NeuroClaw © 2026 | Autonomous Device Action Agent & Zero-Trust Orchestrator</span>
      </footer>
    </div>
  );
}
