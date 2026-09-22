import os
import shutil
import subprocess
import socket
import time
import logging
from typing import List, Optional
from dotenv import load_dotenv

# Load configuration from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("NeuroClaw")

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from server import openclaw_engine as oclaw
from server import desktop_controller as desktop_ctl

app = FastAPI(
    title="NeuroClaw OpenClaw Gateway API",
    description="Agentic Task Automation & On-Device NPU Wireless Execution Bridge",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADB_PATH = os.environ.get("ADB_PATH", r"C:\Users\yashr\AppData\Local\Android\Sdk\platform-tools\adb.exe")
if not os.path.exists(ADB_PATH):
    ADB_PATH = shutil.which("adb") or "adb"

last_wireless_ip: Optional[str] = None
latest_dispatched_step: dict = {}

def get_host_ip() -> str:
    """Resolve active LAN IP across online/offline interfaces and .env configuration."""
    override = os.environ.get("VITE_API_HOST") or os.environ.get("HOST_IP")
    if override and override != "127.0.0.1" and override != "localhost":
        return override.strip()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and not ip.startswith("169.254."):
                return ip
    except Exception:
        pass
    return "127.0.0.1"

def get_active_device_serial() -> Optional[str]:
    """Return the serial of the primary active device (handles multiple devices safely)."""
    try:
        res = subprocess.run([ADB_PATH, "devices"], capture_output=True, text=True, timeout=3)
        lines = [l.strip() for l in res.stdout.splitlines() if "\tdevice" in l]
        if lines:
            # Prefer USB serial (no colon) if available, else first device
            usb_lines = [l for l in lines if ":" not in l.split("\t")[0]]
            return (usb_lines[0] if usb_lines else lines[0]).split("\t")[0]
    except Exception:
        pass
    return None

def run_adb(args: List[str], timeout: int = 5) -> str:
    """Execute ADB command safely, injecting device serial if multiple devices are attached."""
    try:
        top_level = {"devices", "connect", "disconnect", "tcpip", "version", "help", "pair"}
        cmd = [ADB_PATH]
        if args and args[0] not in top_level and "-s" not in args:
            serial = get_active_device_serial()
            if serial:
                cmd.extend(["-s", serial])
        cmd.extend(args)
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except Exception:
        return ""


def detect_device_wifi_ip() -> Optional[str]:
    # Check if a wireless device is already listed in adb devices
    devs = run_adb(["devices"])
    for line in devs.splitlines():
        if ":5555" in line and "\tdevice" in line:
            return line.split("\t")[0].split(":")[0]
    
    # Try querying connected device's wlan0 IP
    out = run_adb(["shell", "ip", "-4", "addr", "show", "wlan0"])
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("inet "):
            ip = line.split()[1].split("/")[0]
            if ip and not ip.startswith("127."):
                return ip
    
    prop_ip = run_adb(["shell", "getprop", "dhcp.wlan0.ipaddress"])
    if prop_ip and "." in prop_ip:
        return prop_ip.strip()
    return None

class TaskRequest(BaseModel):
    goal: str
    target_apps: Optional[List[str]] = []
    device_model: str = "Android Device (Snapdragon NPU)"
    monster_mode: bool = True

class ActionRequest(BaseModel):
    action: str
    params: Optional[dict] = {}

class WirelessConnectRequest(BaseModel):
    ip: str
    port: int = 5555

class WirelessPairRequest(BaseModel):
    ip: str
    port: int
    code: str

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "NeuroClaw LAM Core",
        "npu_engine": "Qualcomm Hexagon INT4 Active",
        "tops": 45,
        "host_ip": get_host_ip()
    }

@app.get("/api/network/info")
def get_network_info():
    host_ip = get_host_ip()
    phone_ip = detect_device_wifi_ip() or last_wireless_ip
    return {
        "host_ip": host_ip,
        "web_url": f"http://{host_ip}:5173",
        "api_url": f"http://{host_ip}:8000",
        "detected_phone_ip": phone_ip,
        "wireless_adb_port": 5555
    }

sync_state = {
    "task_id": "idle",
    "scenario_id": 1,
    "step_index": 0,
    "is_executing": False,
    "is_auth_open": False,
    "auth_passed": False,
    "last_updated": time.time()
}

@app.get("/api/sync/state")
def get_sync_state():
    return sync_state

@app.post("/api/sync/update")
def update_sync_state(payload: dict):
    global sync_state
    sync_state.update(payload)
    sync_state["last_updated"] = time.time()
    return {"status": "ok", "state": sync_state}

@app.get("/api/device/status")
def get_device_status():
    global last_wireless_ip
    devices_out = run_adb(["devices"])
    lines = [line.strip() for line in devices_out.splitlines() if "\tdevice" in line]
    
    # If no devices attached, try auto-reconnecting to last known wireless IP
    if not lines and last_wireless_ip:
        run_adb(["connect", f"{last_wireless_ip}:5555"], timeout=3)
        devices_out = run_adb(["devices"])
        lines = [line.strip() for line in devices_out.splitlines() if "\tdevice" in line]

    if not lines:
        return {
            "connected": False,
            "serial": "None",
            "model": "Simulated Device (Snapdragon NPU)",
            "battery_level": 88,
            "temperature_c": 38.0,
            "charging": False,
            "app_foreground": "Simulated",
            "link_speed": "Virtual Simulator",
            "connection_type": "disconnected"
        }
    
    serial = lines[0].split("\t")[0]
    is_wireless = ":5555" in serial or (":" in serial and not serial.startswith("emulator"))
    if is_wireless:
        last_wireless_ip = serial.split(":")[0]

    model = run_adb(["-s", serial, "shell", "getprop", "ro.product.model"]) or "Snapdragon NPU Device"
    battery_out = run_adb(["-s", serial, "shell", "dumpsys", "battery"])
    
    level = 88
    temp = 36.0
    charging = False
    for b_line in battery_out.splitlines():
        b_line = b_line.strip()
        if b_line.startswith("level:"):
            try: level = int(b_line.split(":")[1].strip())
            except Exception: pass
        elif b_line.startswith("temperature:"):
            try: temp = float(b_line.split(":")[1].strip()) / 10.0
            except Exception: pass
        elif b_line.startswith("USB powered:") or b_line.startswith("AC powered:"):
            if "true" in b_line.lower():
                charging = True

    return {
        "connected": True,
        "serial": serial,
        "model": f"{model} (Snapdragon NPU)",
        "battery_level": level,
        "temperature_c": temp,
        "charging": charging,
        "app_foreground": "com.neuroclaw.agent",
        "connection_type": "wireless" if is_wireless else "usb",
        "link_speed": "WiFi 5GHz (1.4ms)" if is_wireless else "USB 3.0 High-Speed (0.8ms)",
        "host_ip": get_host_ip()
    }

@app.post("/api/device/wireless/setup")
def setup_wireless_adb():
    global last_wireless_ip
    # 1. Enable TCP mode on port 5555
    res_tcp = run_adb(["tcpip", "5555"], timeout=6)
    
    # 2. Try to find phone's WiFi IP
    phone_ip = detect_device_wifi_ip() or last_wireless_ip
    if phone_ip:
        last_wireless_ip = phone_ip
        connect_res = run_adb(["connect", f"{phone_ip}:5555"], timeout=5)
        return {
            "success": "connected" in connect_res.lower() or "already" in connect_res.lower(),
            "phone_ip": phone_ip,
            "message": f"Wireless ADB connected to {phone_ip}:5555. You may disconnect USB cable!",
            "output": connect_res
        }
    
    return {
        "success": False,
        "needs_ip": True,
        "message": "ADB TCP port 5555 enabled. Please connect phone to WiFi/Hotspot and enter its IP.",
        "output": res_tcp
    }

@app.post("/api/device/wireless/connect")
def connect_wireless(req: WirelessConnectRequest):
    global last_wireless_ip
    target = f"{req.ip}:{req.port}"
    res = run_adb(["connect", target], timeout=6)
    is_success = "connected" in res.lower() or "already connected" in res.lower()
    if is_success:
        last_wireless_ip = req.ip
    return {
        "success": is_success,
        "target": target,
        "output": res
    }

@app.post("/api/device/wireless/pair")
def pair_wireless(req: WirelessPairRequest):
    target = f"{req.ip}:{req.port}"
    res = run_adb(["pair", target, req.code], timeout=8)
    return {
        "success": "successfully paired" in res.lower(),
        "target": target,
        "output": res
    }

@app.get("/api/device/screencap")
def get_device_screencap():
    try:
        serial = get_active_device_serial()
        cmd = [ADB_PATH]
        if serial:
            cmd.extend(["-s", serial])
        cmd.extend(["exec-out", "screencap", "-p"])
        res = subprocess.run(cmd, capture_output=True, timeout=6)
        if res.returncode == 0 and len(res.stdout) > 1000:
            return Response(content=res.stdout, media_type="image/png")
    except Exception:
        pass
    raise HTTPException(status_code=503, detail="Screen capture unavailable")

@app.post("/api/device/action")
def send_device_action(req: ActionRequest):
    if req.action == "wake":
        run_adb(["shell", "input", "keyevent", "224"])
        return {"status": "ok", "action": "woken"}
    elif req.action == "launch_app":
        run_adb(["shell", "monkey", "-p", "com.neuroclaw.agent", "-c", "android.intent.category.LAUNCHER", "1"])
        return {"status": "ok", "action": "app_launched"}
    elif req.action == "home":
        run_adb(["shell", "input", "keyevent", "3"])
        return {"status": "ok", "action": "home_pressed"}
    elif req.action == "back":
        run_adb(["shell", "input", "keyevent", "4"])
        return {"status": "ok", "action": "back_pressed"}
    elif req.action == "wifi_settings":
        run_adb(["shell", "am", "start", "-a", "android.settings.WIFI_SETTINGS"])
        return {"status": "ok", "action": "opened_wifi_settings"}
    return {"status": "ignored"}

@app.post("/api/plan_task")
def plan_task(req: TaskRequest):
    """Real LAM goal decomposition via Gemini Flash (falls back offline)."""
    oclaw.clear_trace()
    steps = oclaw.plan_with_gemini(req.goal, req.target_apps or [])
    return {
        "goal": req.goal,
        "device": req.device_model,
        "steps": steps,
        "model": "gemini-2.0-flash" if os.environ.get("GEMINI_API_KEY") else "offline-fallback",
        "timestamp": time.time()
    }


class ToolCallRequest(BaseModel):
    tool: str
    params: dict = {}


@app.post("/api/openclaw/execute_step")
def openclaw_execute_step(req: ToolCallRequest):
    """Execute one OpenClaw tool call — real ADB or gate trigger."""
    result = oclaw.execute_tool(req.tool, req.params, run_adb)
    return result


@app.get("/api/openclaw/tool_trace")
def openclaw_tool_trace():
    """Return ordered list of all tool calls in the current session."""
    return {"trace": oclaw.get_trace(), "count": len(oclaw.get_trace())}


@app.delete("/api/openclaw/tool_trace")
def openclaw_clear_trace():
    oclaw.clear_trace()
    return {"status": "cleared"}


@app.get("/api/device/ui_dump")
def get_ui_dump():
    """Run uiautomator dump and return parsed interactive nodes for LLM context."""
    raw = run_adb(["shell", "uiautomator", "dump", "/dev/stdout"], timeout=8)
    if not raw:
        return {"nodes": [], "raw": ""}
    import re
    nodes = []
    for m in re.finditer(r'text="([^"]+)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', raw):
        nodes.append({"text": m.group(1), "x": (int(m.group(2)) + int(m.group(4))) // 2, "y": (int(m.group(3)) + int(m.group(5))) // 2})
    return {"nodes": nodes[:15], "total": len(nodes)}


# --- Desktop Remote Controller via OpenClaw ---

class DesktopActionReq(BaseModel):
    action: str

class DesktopCommandReq(BaseModel):
    command: str

class DesktopOpenClawReq(BaseModel):
    goal: str

@app.get("/api/desktop/status")
def get_desktop_status():
    """Return desktop telemetry & connectivity for mobile remote control."""
    return desktop_ctl.get_desktop_telemetry()

@app.post("/api/desktop/action")
def trigger_desktop_action(req: DesktopActionReq):
    """Execute pre-defined desktop action triggered remotely from phone."""
    res = desktop_ctl.execute_desktop_action(req.action)
    oclaw.tool_trace.append({
        "tool": f"desktop_{req.action}",
        "params": {"action": req.action},
        "ts": time.time(),
        "status": res.get("status", "ok"),
        "output": res
    })
    update_sync_state({
        "last_remote_command": f"Desktop: {req.action}",
        "last_remote_ts": time.time()
    })
    return res

@app.post("/api/desktop/command")
def trigger_desktop_command(req: DesktopCommandReq):
    """Execute terminal command on desktop triggered remotely from phone."""
    res = desktop_ctl.run_desktop_command(req.command)
    oclaw.tool_trace.append({
        "tool": "desktop_command",
        "params": {"command": req.command},
        "ts": time.time(),
        "status": res.get("status", "ok"),
        "output": res
    })
    update_sync_state({
        "last_remote_command": f"CMD: {req.command[:30]}",
        "last_remote_ts": time.time()
    })
    return res

@app.post("/api/desktop/openclaw")
def execute_desktop_openclaw(req: DesktopOpenClawReq):
    """Execute natural language goal on desktop via OpenClaw LAM dispatcher."""
    goal_lower = req.goal.lower()
    if any(w in goal_lower for w in ["git", "status", "diff", "branch"]):
        res = desktop_ctl.execute_desktop_action("git_status")
    elif any(w in goal_lower for w in ["build", "compile", "bundle"]):
        res = desktop_ctl.execute_desktop_action("build_project")
    elif any(w in goal_lower for w in ["vscode", "code", "editor"]):
        res = desktop_ctl.execute_desktop_action("launch_vscode")
    elif any(w in goal_lower for w in ["lock", "workstation"]):
        res = desktop_ctl.execute_desktop_action("lock_pc")
    elif any(w in goal_lower for w in ["terminal", "powershell", "console"]):
        res = desktop_ctl.execute_desktop_action("open_terminal")
    elif any(w in goal_lower for w in ["browser", "web", "chrome"]):
        res = desktop_ctl.execute_desktop_action("launch_browser")
    else:
        res = desktop_ctl.run_desktop_command(req.goal)

    oclaw.tool_trace.append({
        "tool": "desktop_openclaw_lam",
        "params": {"goal": req.goal},
        "ts": time.time(),
        "status": res.get("status", "ok"),
        "output": res
    })
    update_sync_state({
        "last_remote_command": f"OpenClaw: {req.goal[:30]}",
        "last_remote_ts": time.time()
    })
    return res


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

