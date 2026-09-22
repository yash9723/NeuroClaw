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
      {
        id: 1,
        title: 'Perceiving Screen Context',
        detail: 'MediaProjection captured 1080x2400 screen. Found Gmail notification.',
        action: 'screen_inspect',
        npuLatency: '42ms'
      },
      {
        id: 2,
        title: 'Reading & Parsing Email Body',
        detail: 'Extracted: "Server memory leak fixed. Ready for release 2.4.0 deploy approval."',
        action: 'extract_text',
        npuLatency: '110ms'
      },
      {
        id: 3,
        title: 'Synthesizing Concise Summary',
        detail: 'Summarized into 1 sentence for developer WhatsApp channel.',
        action: 'llm_reasoning',
        npuLatency: '85ms'
      },
      {
        id: 4,
        title: 'Navigating to WhatsApp App',
        detail: 'Simulated intent: com.whatsapp. Chat target: "Core Dev Team".',
        action: 'app_switch',
        npuLatency: '55ms'
      },
      {
        id: 5,
        title: 'Zero-Trust Biometric Gate Triggered',
        detail: 'Pre-send security challenge: Facial recognition verification required.',
        action: 'security_gate',
        isAuthGate: true,
        npuLatency: '15ms'
      },
      {
        id: 6,
        title: 'Synthesizing Keystrokes & Dispatch',
        detail: 'Injected text into chat input and tapped send icon.',
        action: 'touch_synthesizer',
        npuLatency: '60ms'
      },
      {
        id: 7,
        title: 'Post-Execution Audit Notification',
        detail: 'Logged cryptographic audit hash #9481a and triggered device dual-haptics.',
        action: 'audit_receipt',
        npuLatency: '18ms'
      }
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
      {
        id: 1,
        title: 'Launching Blinkit App',
        detail: 'Intent com.grofers.customer dispatched via Android Accessibility Service.',
        action: 'app_launch',
        npuLatency: '65ms'
      },
      {
        id: 2,
        title: 'Locating Search Input & Querying',
        detail: 'Tapped search field (x: 540, y: 320). Synthesized typing "Amul Taaza 1L".',
        action: 'touch_synthesizer',
        npuLatency: '120ms'
      },
      {
        id: 3,
        title: 'Vision-Based Product Match',
        detail: 'Item identified with 99.4% confidence. Tapped "ADD" button (x: 890, y: 740).',
        action: 'vision_ocr',
        npuLatency: '95ms'
      },
      {
        id: 4,
        title: 'Zero-Trust Payment Authentication',
        detail: 'Cart value: ₹68.00. Mandatory Facial Recognition check prior to payment swipe.',
        action: 'security_gate',
        isAuthGate: true,
        npuLatency: '20ms'
      },
      {
        id: 5,
        title: 'Finalizing Order & Payment',
        detail: 'Tapped "Pay & Place Order". Payment webhook acknowledged.',
        action: 'payment_dispatch',
        npuLatency: '140ms'
      },
      {
        id: 6,
        title: 'Order Tracking Active',
        detail: 'Estimated delivery: 8 minutes. Live rider tracking embedded.',
        action: 'audit_receipt',
        npuLatency: '30ms'
      }
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
      {
        id: 1,
        title: 'Ingesting Live Error Logs',
        detail: 'Tail log: "FATAL: Connection pool exhausted (max_clients=100 reached)".',
        action: 'log_ingest',
        npuLatency: '35ms'
      },
      {
        id: 2,
        title: 'Root Cause Diagnosis (NPU Brain)',
        detail: 'Deadlock in db_pool.py: line 44 missing connection release on error.',
        action: 'llm_reasoning',
        npuLatency: '180ms'
      },
      {
        id: 3,
        title: 'Synthesizing Bug Patch',
        detail: 'Generated 4-line patch using try/finally pool.release() block.',
        action: 'code_generator',
        npuLatency: '150ms'
      },
      {
        id: 4,
        title: 'Dispatching GitHub Pull Request',
        detail: 'Dispatched via OpenClaw skill: PR #104 opened on repository.',
        action: 'openclaw_dispatch',
        npuLatency: '210ms'
      },
      {
        id: 5,
        title: 'Dispatched Team Notification',
        detail: 'Posted PR link to Discord/Slack channel with 90-second MTTR tag.',
        action: 'audit_receipt',
        npuLatency: '25ms'
      }
    ]
  }
];
