// Autonomous Agent Action Engine & OpenClaw Workflow Definitions
// Simulates on-device Snapdragon NPU / OpenClaw execution loops

import { apiUrl } from './bridge';

/**
 * Dynamically plan a task via the OpenClaw LAM (Gemini Flash).
 * Falls back to the nearest matching SCENARIO if the server is unreachable.
 * @param {string} goal - Natural language goal
 * @param {string[]} apps - Target app names
 * @returns {Promise<object>} - Scenario-shaped object with steps[]
 */
export async function planWithOpenClaw(goal, apps = []) {
  try {
    const res = await fetch(apiUrl('/api/plan_task'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, target_apps: apps, monster_mode: true })
    });
    if (!res.ok) throw new Error('plan_task non-ok');
    const data = await res.json();
    if (!data.steps?.length) throw new Error('empty steps');

    return {
      id: 'openclaw_' + Date.now(),
      title: goal.slice(0, 48),
      targetApps: apps.length ? apps : ['System'],
      prompt: goal,
      sensitive: data.steps.some(s => s.isAuthGate),
      authRequiredReason: data.steps.find(s => s.isAuthGate)?.detail || null,
      steps: data.steps,
      _model: data.model || 'offline-fallback',
    };
  } catch (_) {
    // Offline: pick closest canned scenario by keyword
    const lower = goal.toLowerCase();
    const match = SCENARIOS.find(s =>
      s.targetApps.some(a => lower.includes(a.toLowerCase())) ||
      lower.includes(s.id)
    ) || SCENARIOS[0];
    return { ...match, prompt: goal };
  }
}


export const SCENARIOS = [
  {
    id: 'email_whatsapp',
    title: 'Cross-App Triage & Send',
    targetApps: ['Gmail', 'WhatsApp'],
    prompt: 'Summarize latest critical email from client and send update on WhatsApp',
    sensitive: true,
    authRequiredReason: 'Outbound messaging on official WhatsApp account',
    steps: [
      { id: 1, title: 'Perceiving Screen Context', detail: 'MediaProjection captured 1080x2400 screen. Found Gmail notification.', action: 'screen_inspect', npuLatency: '42ms', _tool: 'inspect_screen', _params: { focus_app: 'com.google.android.gm' } },
      { id: 2, title: 'Reading & Parsing Email Body', detail: 'Extracted: "Server memory leak fixed. Ready for release 2.4.0 deploy approval."', action: 'extract_text', npuLatency: '110ms', _tool: 'inspect_screen', _params: { extract_text: true } },
      { id: 3, title: 'Synthesizing Concise Summary', detail: 'Summarized into 1 sentence for developer WhatsApp channel.', action: 'llm_reasoning', npuLatency: '85ms', _tool: 'set_hardware_profile', _params: { profile: 'MONSTER_PERFORMANCE' } },
      { id: 4, title: 'Navigating to WhatsApp App', detail: 'Simulated intent: com.whatsapp. Chat target: "Core Dev Team".', action: 'app_switch', npuLatency: '55ms', _tool: 'synthesize_touch', _params: { action_type: 'tap', coordinates: { x: 540, y: 1100 } } },
      { id: 5, title: 'Zero-Trust Biometric Gate Triggered', detail: 'Pre-send security challenge: Facial recognition verification required.', action: 'security_gate', isAuthGate: true, npuLatency: '15ms', _tool: 'trigger_biometric_gate', _params: { task_description: 'Outbound WhatsApp Dispatch', risk_level: 'CRITICAL_MESSAGING' } },
      { id: 6, title: 'Synthesizing Keystrokes & Dispatch', detail: 'Injected text into chat input and tapped send icon.', action: 'touch_synthesizer', npuLatency: '60ms', _tool: 'synthesize_touch', _params: { action_type: 'type_text', text: 'Deploy approval ready' } },
      { id: 7, title: 'Post-Execution Audit Notification', detail: 'Logged cryptographic audit hash #9481a and triggered device dual-haptics.', action: 'audit_receipt', npuLatency: '18ms', _tool: 'inspect_screen', _params: { focus_app: 'com.whatsapp' } }
    ]
  },
  {
    id: 'quick_commerce',
    title: 'Blinkit Instant Commerce Order',
    targetApps: ['Blinkit', 'Google Pay'],
    prompt: 'Order 1 Liter Amul Taaza Milk from Blinkit in under 10 minutes',
    sensitive: true,
    authRequiredReason: 'Financial transaction authorization ($2.10 via UPI)',
    steps: [
      { id: 1, title: 'Launching Blinkit App', detail: 'Intent com.grofers.customer dispatched via Android Accessibility Service.', action: 'app_launch', npuLatency: '65ms', _tool: 'inspect_screen', _params: { focus_app: 'com.grofers.customer' } },
      { id: 2, title: 'Locating Search Input & Querying', detail: 'Tapped search field (x: 540, y: 320). Synthesized typing "Amul Taaza 1L".', action: 'touch_synthesizer', npuLatency: '120ms', _tool: 'synthesize_touch', _params: { action_type: 'tap', coordinates: { x: 540, y: 320 } } },
      { id: 3, title: 'Vision-Based Product Match', detail: 'Item identified with 99.4% confidence. Tapped "ADD" button (x: 890, y: 740).', action: 'vision_ocr', npuLatency: '95ms', _tool: 'synthesize_touch', _params: { action_type: 'tap', coordinates: { x: 890, y: 740 } } },
      { id: 4, title: 'Zero-Trust Payment Authentication', detail: 'Cart value: ₹68.00. Mandatory Facial Recognition check prior to payment swipe.', action: 'security_gate', isAuthGate: true, npuLatency: '20ms', _tool: 'trigger_biometric_gate', _params: { task_description: '₹68.00 UPI Payment Authorization', risk_level: 'CRITICAL_FINANCIAL' } },
      { id: 5, title: 'Finalizing Order & Payment', detail: 'Tapped "Pay & Place Order". Payment webhook acknowledged.', action: 'payment_dispatch', npuLatency: '140ms', _tool: 'synthesize_touch', _params: { action_type: 'tap', coordinates: { x: 540, y: 2150 } } },
      { id: 6, title: 'Order Tracking Active', detail: 'Estimated delivery: 8 minutes. Live rider tracking embedded.', action: 'audit_receipt', npuLatency: '30ms', _tool: 'inspect_screen', _params: { track_order: true } }
    ]
  },
  {
    id: 'devops_healer',
    title: 'Incident Triage & Self-Healing',
    targetApps: ['Termux', 'GitHub', 'OpenClaw'],
    prompt: 'Diagnose 502 Bad Gateway in staging container, create patch and open PR',
    sensitive: false,
    authRequiredReason: null,
    steps: [
      { id: 1, title: 'Ingesting Live Error Logs', detail: 'Tail log: "FATAL: Connection pool exhausted (max_clients=100 reached)".', action: 'log_ingest', npuLatency: '35ms', _tool: 'desktop_action', _params: { action: 'powershell', command: 'Get-Service -Name *wsl*,*docker* -ErrorAction SilentlyContinue | Select-Object Status, Name' } },
      { id: 2, title: 'Root Cause Diagnosis (NPU Brain)', detail: 'Deadlock in db_pool.py: line 44 missing connection release on error.', action: 'llm_reasoning', npuLatency: '180ms', _tool: 'desktop_action', _params: { action: 'git_status' } },
      { id: 3, title: 'Synthesizing Bug Patch', detail: 'Generated 4-line patch using try/finally pool.release() block.', action: 'code_generator', npuLatency: '150ms', _tool: 'desktop_action', _params: { action: 'powershell', command: 'git diff --stat' } },
      { id: 4, title: 'Dispatching GitHub Pull Request', detail: 'Dispatched via OpenClaw skill: PR #104 opened on repository.', action: 'openclaw_dispatch', npuLatency: '210ms', _tool: 'trigger_biometric_gate', _params: { task_description: 'Authorize Staging Release Merge', risk_level: 'MEDIUM' } },
      { id: 5, title: 'Dispatched Team Notification', detail: 'Posted PR link to Discord/Slack channel with 90-second MTTR tag.', action: 'audit_receipt', npuLatency: '25ms', _tool: 'desktop_action', _params: { action: 'launch_vscode' } }
    ]
  }
];
