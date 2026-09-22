# OpenClaw Execution Engine — Gemini Flash LAM + 4-Tool Dispatcher
# Ponytail: ≤120 lines, no new npm deps, native APIs only

import os, time, json, re
from typing import Optional

tool_trace: list[dict] = []  # in-memory session tool call log

# --- LLM Planner ---

def plan_with_gemini(goal: str, apps: list[str], screen_ctx: str = "") -> list[dict]:
    """Call Gemini Flash to decompose a goal into OpenClaw tool-call steps."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return _fallback_plan(goal, apps)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        system = (
            "You are OpenClaw, a Large Action Model (LAM) for Android device automation. "
            "Decompose the user's goal into 3-6 sequential tool calls using ONLY these tools:\n"
            "1. inspect_screen - Capture viewport/accessibility tree. params: {focus_app: string}\n"
            "2. synthesize_touch - Inject tap/swipe/text. params: {action_type: tap|swipe|type_text, coordinates: {x,y}, text?: string}\n"
            "3. trigger_biometric_gate - Halt for facial/PIN auth. params: {task_description: string, risk_level: LOW|MEDIUM|CRITICAL_FINANCIAL|CRITICAL_MESSAGING}\n"
            "4. set_hardware_profile - NPU mode. params: {profile: MONSTER_PERFORMANCE|ECO_BATTERY_SAVER}\n\n"
            "Return ONLY a JSON array. Each item: {tool, params, title, detail, npu_latency, is_auth_gate}. "
            "is_auth_gate=true ONLY for trigger_biometric_gate steps."
        )
        screen_suffix = f"\n\nCurrent screen context:\n{screen_ctx}" if screen_ctx else ""
        prompt = f"Goal: {goal}\nTarget apps: {', '.join(apps) or 'any'}{screen_suffix}"

        resp = model.generate_content(f"{system}\n\n{prompt}")
        raw = resp.text.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```[a-z]*\n?", "", raw).rstrip("`").strip()
        steps_raw = json.loads(raw)

        steps = []
        for i, s in enumerate(steps_raw):
            steps.append({
                "id": i + 1,
                "title": s.get("title", s["tool"]),
                "detail": s.get("detail", str(s.get("params", {}))),
                "action": s["tool"],
                "npuLatency": s.get("npu_latency", "60ms"),
                "isAuthGate": bool(s.get("is_auth_gate", False)),
                "_tool": s["tool"],
                "_params": s.get("params", {}),
            })
        return steps
    except Exception as e:
        print(f"[OpenClaw] Gemini plan failed: {e}")
        return _fallback_plan(goal, apps)


def _fallback_plan(goal: str, apps: list[str]) -> list[dict]:
    """Offline keyword fallback — mirrors legacy plan_task logic."""
    is_order = any(w in goal.lower() for w in ["milk", "order", "grocery", "blinkit"])
    is_msg   = any(w in goal.lower() for w in ["message", "whatsapp", "send", "email"])
    risk     = "CRITICAL_FINANCIAL" if is_order else "CRITICAL_MESSAGING" if is_msg else "MEDIUM"
    return [
        {"id": 1, "title": "Inspect Screen Context", "detail": "Capture viewport accessibility tree.", "action": "inspect_screen", "npuLatency": "35ms", "isAuthGate": False, "_tool": "inspect_screen", "_params": {"focus_app": (apps[0] if apps else "system")}},
        {"id": 2, "title": "Synthesize Action Payload", "detail": "Plan touch/text sequence for goal.", "action": "llm_reasoning",  "npuLatency": "95ms", "isAuthGate": False, "_tool": "synthesize_touch", "_params": {"action_type": "tap", "coordinates": {"x": 540, "y": 320}}},
        {"id": 3, "title": "Zero-Trust Biometric Gate", "detail": "Facial recognition challenge.", "action": "security_gate",  "npuLatency": "18ms", "isAuthGate": True,  "_tool": "trigger_biometric_gate", "_params": {"task_description": goal, "risk_level": risk}},
        {"id": 4, "title": "Execute & Confirm",         "detail": "Dispatch action and log audit hash.", "action": "touch_synthesizer","npuLatency": "60ms", "isAuthGate": False, "_tool": "synthesize_touch", "_params": {"action_type": "tap", "coordinates": {"x": 890, "y": 740}}},
    ]


# --- Tool Executor ---

def execute_tool(tool: str, params: dict, run_adb) -> dict:
    """Execute one OpenClaw tool call. run_adb is injected from agent_api."""
    result = {"tool": tool, "params": params, "ts": time.time(), "status": "ok", "output": {}}
    try:
        if tool == "inspect_screen":
            dump = run_adb(["shell", "uiautomator", "dump", "/dev/stdout"], timeout=6)
            # Extract top 5 clickable nodes for brevity
            nodes = re.findall(r'text="([^"]+)"[^/]*clickable="true"', dump)[:5]
            result["output"] = {"clickable_nodes": nodes, "raw_length": len(dump)}

        elif tool == "synthesize_touch":
            atype = params.get("action_type", "tap")
            coords = params.get("coordinates", {"x": 540, "y": 960})
            if atype == "tap":
                run_adb(["shell", "input", "tap", str(coords["x"]), str(coords["y"])])
            elif atype == "type_text":
                text = params.get("text", "").replace(" ", "%s")
                run_adb(["shell", "input", "text", text])
            result["output"] = {"dispatched": atype, "at": coords}

        elif tool == "trigger_biometric_gate":
            # Gate is handled client-side; server just logs it
            result["output"] = {"gate_raised": True, "risk_level": params.get("risk_level", "MEDIUM")}

        elif tool == "set_hardware_profile":
            profile = params.get("profile", "MONSTER_PERFORMANCE")
            # Performance mode via Android settings (best-effort)
            if profile == "MONSTER_PERFORMANCE":
                run_adb(["shell", "settings", "put", "global", "animator_duration_scale", "0"])
            result["output"] = {"profile_set": profile}

    except Exception as e:
        result["status"] = "error"
        result["output"] = {"error": str(e)}

    tool_trace.append(result)
    return result


def get_trace() -> list[dict]:
    return tool_trace


def clear_trace():
    tool_trace.clear()
