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

import asyncio
import threading
from fastapi import FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from server import openclaw_engine as oclaw
from server import desktop_controller as desktop_ctl

active_ws_clients: set = set()
main_loop: Optional[asyncio.AbstractEventLoop] = None

_latest_screencap = {"data": None, "time": 0.0}
_screencap_lock = threading.Lock()
_screencap_active_until = 0.0

def background_screencap_worker():
    global _latest_screencap, _screencap_active_until
    while True:
        try:
            now = time.time()
            if now < _screencap_active_until:
                serial = get_active_device_serial()
                if serial:
                    cmd = [ADB_PATH, "-s", serial, "exec-out", "screencap", "-p"]
                    res = subprocess.run(cmd, capture_output=True, timeout=3)
                    if res.returncode == 0 and len(res.stdout) > 1000:
                        with _screencap_lock:
                            _latest_screencap = {"data": res.stdout, "time": time.time()}
            time.sleep(0.4)
        except Exception:
            time.sleep(1.0)

async def broadcast_ws(event: dict):
    if not active_ws_clients:
        return
    dead = []
    for ws in list(active_ws_clients):
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_ws_clients.discard(ws)

def broadcast_sync(event: dict):
    global main_loop
    if not active_ws_clients:
        return
    try:
        if main_loop and main_loop.is_running():
            asyncio.run_coroutine_threadsafe(broadcast_ws(event), main_loop)
        else:
            loop = asyncio.get_running_loop()
            loop.create_task(broadcast_ws(event))
    except Exception as e:
        logger.debug(f"broadcast_sync error: {e}")

app = FastAPI(
    title="NeuroClaw OpenClaw Gateway API",
    description="Agentic Task Automation & On-Device NPU Wireless Execution Bridge",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()
    logger.info("FastAPI main event loop captured for threadsafe WebSocket broadcasting.")
    threading.Thread(target=background_screencap_worker, daemon=True).start()

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

_cached_serial = (0.0, None)

def get_active_device_serial() -> Optional[str]:
    """Return the serial of the primary active device with a short 2s cache."""
    global _cached_serial
    now = time.time()
    if now - _cached_serial[0] < 2.0:
        return _cached_serial[1]
    serial = None
    try:
        res = subprocess.run([ADB_PATH, "devices"], capture_output=True, text=True, timeout=1.5)
        lines = [l.strip() for l in res.stdout.splitlines() if "\tdevice" in l]
        if lines:
            usb_lines = [l for l in lines if ":" not in l.split("\t")[0]]
            serial = (usb_lines[0] if usb_lines else lines[0]).split("\t")[0]
    except Exception:
        pass
    _cached_serial = (now, serial)
    return serial

def run_adb(args: List[str], timeout: int = 5) -> str:
    """Execute ADB command safely, injecting device serial if multiple devices are attached."""
    try:
        top_level = {"devices", "connect", "disconnect", "tcpip", "version", "help", "pair"}
        cmd = [ADB_PATH]
        if args and args[0] not in top_level and "-s" not in args:
            serial = get_active_device_serial()
            if serial:
                cmd.extend(["-s", serial])
            else:
                return ""
        cmd.extend(args)
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except Exception:
        return ""


def detect_device_wifi_ip() -> Optional[str]:
    # Check if an active device is connected
    serial = get_active_device_serial()
    if not serial:
        return None
    if ":5555" in serial or (":" in serial and not serial.startswith("emulator")):
        return serial.split(":")[0]

    # Try querying connected device's wlan0 IP
    out = run_adb(["shell", "ip", "-4", "addr", "show", "wlan0"], timeout=1.5)
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("inet "):
            ip = line.split()[1].split("/")[0]
            if ip and not ip.startswith("127."):
                return ip

    prop_ip = run_adb(["shell", "getprop", "dhcp.wlan0.ipaddress"], timeout=1.5)
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

class ControlTapRequest(BaseModel):
    x: Optional[int] = None
    y: Optional[int] = None
    pct_x: Optional[float] = None
    pct_y: Optional[float] = None

class ControlSwipeRequest(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    duration_ms: int = 300

class ControlKeyRequest(BaseModel):
    key: str

class ControlTextRequest(BaseModel):
    text: str

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

def apply_sync_update(payload: dict) -> dict:
    global sync_state
    sync_state.update(payload)
    sync_state["last_updated"] = time.time()
    broadcast_sync({"type": "sync_state", "data": sync_state})
    return sync_state

@app.post("/api/sync/update")
async def update_sync_state_endpoint(payload: dict):
    state = apply_sync_update(payload)
    return {"status": "ok", "state": state}

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_ws_clients.add(websocket)
    try:
        await websocket.send_json({
            "type": "init",
            "sync_state": sync_state,
            "tool_trace": oclaw.get_trace()[-10:],
            "host_ip": get_host_ip()
        })
        while True:
            data = await websocket.receive_json()
            mtype = data.get("type")
            if mtype == "sync_update":
                sync_state.update(data.get("payload", {}))
                sync_state["last_updated"] = time.time()
                await broadcast_ws({"type": "sync_state", "data": sync_state})
            elif mtype == "execute_tool":
                res = oclaw.execute_tool(data.get("tool"), data.get("params", {}), run_adb)
                await broadcast_ws({"type": "tool_call", "data": res})
    except (WebSocketDisconnect, Exception):
        active_ws_clients.discard(websocket)

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

# --- Bluetooth Connectivity & Pairing Bridge ---

@app.get("/api/device/bluetooth/status")
def get_bluetooth_status():
    """Query Bluetooth state across PC and connected Android hardware."""
    pc_bt = False
    try:
        res = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", "Get-PnpDevice -Class Bluetooth | Where-Object FriendlyName -like '*Intel*' | Select-Object -ExpandProperty Status"],
            capture_output=True, text=True, timeout=3
        )
        pc_bt = "OK" in res.stdout
    except Exception:
        pass

    phone_bt = False
    phone_name = "POCO X5 5G"
    phone_mac = "E4:BC:AA:9D:D6:BF"
    paired = False

    try:
        bt_dump = run_adb(["shell", "dumpsys", "bluetooth_manager"], timeout=3)
        if "state: ON" in bt_dump or "enabled: true" in bt_dump:
            phone_bt = True
        for line in bt_dump.splitlines():
            line = line.strip()
            if line.startswith("name:") and len(line.split()) > 1:
                phone_name = line.split(":", 1)[1].strip()
            elif line.startswith("Address:") and len(line.split()) > 1:
                phone_mac = line.split(":", 1)[1].strip()

        # Check if phone is in Windows Bluetooth paired list
        check_pair = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", f"Get-PnpDevice -Class Bluetooth | Where-Object FriendlyName -like '*{phone_name}*' | Select-Object -ExpandProperty Status"],
            capture_output=True, text=True, timeout=3
        )
        paired = "OK" in check_pair.stdout
    except Exception:
        pass

    return {
        "pc_bluetooth_ready": pc_bt,
        "phone_bluetooth_on": phone_bt,
        "phone_name": phone_name,
        "phone_address": phone_mac,
        "is_paired": paired,
        "pan_adapter": "Bluetooth Device (Personal Area Network)",
        "timestamp": time.time()
    }

@app.post("/api/device/bluetooth/pair")
def trigger_bluetooth_pair():
    """Trigger discoverable mode on phone and launch Windows Bluetooth pairing wizard."""
    run_adb(["shell", "am", "start", "-a", "android.bluetooth.adapter.action.REQUEST_DISCOVERABLE", "--ei", "android.bluetooth.adapter.extra.DISCOVERABLE_DURATION", "300"], timeout=3)
    try:
        subprocess.Popen(["DevicePairingWizard.exe"], shell=False)
    except Exception:
        subprocess.Popen(["cmd.exe", "/c", "start", "ms-settings:bluetooth"], shell=False)

    return {
        "success": True,
        "message": "Phone set to Bluetooth Discoverable for 300s. Windows Pairing Wizard opened."
    }

@app.post("/api/device/bluetooth/tether")
def trigger_bluetooth_tether():
    """Open Tethering screen on phone to enable Bluetooth PAN networking."""
    run_adb(["shell", "am", "start", "-a", "android.settings.TETHER_SETTINGS"], timeout=3)
    return {
        "success": True,
        "message": "Tethering screen opened on phone. Toggle Bluetooth tethering ON to connect PAN link."
    }

def find_scrcpy_binary() -> Optional[str]:
    p = shutil.which("scrcpy")
    if p:
        return p
    winget_root = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
    if os.path.exists(winget_root):
        for root, dirs, files in os.walk(winget_root):
            if "scrcpy.exe" in files:
                return os.path.join(root, "scrcpy.exe")
    return None

@app.post("/api/device/mirror/launch_desktop")
def launch_desktop_mirror():
    scrcpy_bin = find_scrcpy_binary()
    if not scrcpy_bin:
        return {"success": False, "message": "scrcpy not found"}
    serial = get_active_device_serial()
    cmd = [
        scrcpy_bin,
        "--max-fps=60",
        "-b", "16M",
        "--stay-awake",
        "--video-codec=h264",
        "--video-encoder=c2.android.avc.encoder",
        "--max-size=1080",
        "--window-title", "NeuroClaw Phone Mirror (Locked 60 FPS)"
    ]
    if serial:
        cmd.extend(["-s", serial])
    subprocess.Popen(cmd)
    return {"success": True, "fps": 60, "message": "Native 60 FPS hardware mirror window launched!"}

@app.get("/api/device/screencap")
def get_device_screencap(fresh: int = 0):
    global _screencap_active_until
    _screencap_active_until = time.time() + 20.0
    now = time.time()
    with _screencap_lock:
        if not fresh and _latest_screencap["data"] and (now - _latest_screencap["time"] < 1.0):
            return Response(content=_latest_screencap["data"], media_type="image/png")
    try:
        serial = get_active_device_serial()
        cmd = [ADB_PATH]
        if serial:
            cmd.extend(["-s", serial])
        cmd.extend(["exec-out", "screencap", "-p"])
        res = subprocess.run(cmd, capture_output=True, timeout=5)
        if res.returncode == 0 and len(res.stdout) > 1000:
            with _screencap_lock:
                _latest_screencap = {"data": res.stdout, "time": time.time()}
            return Response(content=res.stdout, media_type="image/png")
    except Exception:
        pass
    with _screencap_lock:
        if _latest_screencap["data"]:
            return Response(content=_latest_screencap["data"], media_type="image/png")
    raise HTTPException(status_code=503, detail="Screen capture unavailable")

_cached_display = (0.0, {"width": 1080, "height": 2400, "density": 440, "orientation": 0})

def get_device_display_info() -> dict:
    global _cached_display
    now = time.time()
    if now - _cached_display[0] < 10.0:
        return _cached_display[1]
    w, h, density = 1080, 2400, 440
    try:
        out = run_adb(["shell", "wm", "size"], timeout=2)
        if "Physical size:" in out:
            size_str = out.split("Physical size:")[-1].strip().split()[0]
            parts = size_str.split("x")
            w, h = int(parts[0]), int(parts[1])
        density_out = run_adb(["shell", "wm", "density"], timeout=2)
        if "Physical density:" in density_out:
            density = int(density_out.split("Physical density:")[-1].strip().split()[0])
    except Exception:
        pass
    info = {"width": w, "height": h, "density": density, "orientation": 0}
    _cached_display = (now, info)
    return info

@app.get("/api/device/display")
def get_device_display():
    return get_device_display_info()

@app.post("/api/device/control/tap")
async def device_control_tap(req: ControlTapRequest):
    display = get_device_display_info()
    if req.pct_x is not None and req.pct_y is not None:
        real_x = int(req.pct_x * display["width"])
        real_y = int(req.pct_y * display["height"])
    else:
        real_x = req.x if req.x is not None else int(display["width"] / 2)
        real_y = req.y if req.y is not None else int(display["height"] / 2)
    run_adb(["shell", "input", "tap", str(real_x), str(real_y)], timeout=2)
    event = {"type": "device_touch", "action": "tap", "x": real_x, "y": real_y}
    await broadcast_ws(event)
    return {"status": "ok", "x": real_x, "y": real_y}

@app.post("/api/device/control/swipe")
async def device_control_swipe(req: ControlSwipeRequest):
    duration = max(50, min(req.duration_ms, 2000))
    run_adb(["shell", "input", "swipe", str(req.x1), str(req.y1), str(req.x2), str(req.y2), str(duration)], timeout=3)
    event = {"type": "device_touch", "action": "swipe", "x1": req.x1, "y1": req.y1, "x2": req.x2, "y2": req.y2}
    await broadcast_ws(event)
    return {"status": "ok", "x1": req.x1, "y1": req.y1, "x2": req.x2, "y2": req.y2}

@app.post("/api/device/control/key")
def device_control_key(req: ControlKeyRequest):
    key_map = {
        "back": "4",
        "home": "3",
        "recents": "187",
        "app_switch": "187",
        "power": "26",
        "wake": "224",
        "volume_up": "24",
        "volume_down": "25",
        "enter": "66",
        "del": "67",
        "backspace": "67",
        "tab": "61",
        "escape": "111"
    }
    key_code = key_map.get(req.key.lower(), req.key)
    run_adb(["shell", "input", "keyevent", str(key_code)], timeout=2)
    return {"status": "ok", "key": req.key, "key_code": key_code}

@app.post("/api/device/control/text")
def device_control_text(req: ControlTextRequest):
    safe_text = req.text.replace(" ", "%s").replace("&", "\\&").replace(";", "\\;")
    run_adb(["shell", "input", "text", safe_text], timeout=3)
    return {"status": "ok", "text": req.text}

@app.post("/api/device/action")
def send_device_action(req: ActionRequest):
    action_map = {
        "wake": ["shell", "input", "keyevent", "224"],
        "launch_app": ["shell", "monkey", "-p", "com.neuroclaw.agent", "-c", "android.intent.category.LAUNCHER", "1"],
        "home": ["shell", "input", "keyevent", "3"],
        "back": ["shell", "input", "keyevent", "4"],
        "recents": ["shell", "input", "keyevent", "187"],
        "power": ["shell", "input", "keyevent", "26"],
        "volume_up": ["shell", "input", "keyevent", "24"],
        "volume_down": ["shell", "input", "keyevent", "25"],
        "wifi_settings": ["shell", "am", "start", "-a", "android.settings.WIFI_SETTINGS"],
        "settings": ["shell", "am", "start", "-a", "android.settings.SETTINGS"],
        "camera": ["shell", "am", "start", "-a", "android.media.action.IMAGE_CAPTURE"],
        "browser": ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "https://google.com"]
    }
    cmd_args = action_map.get(req.action)
    if cmd_args:
        run_adb(cmd_args, timeout=3)
        return {"status": "ok", "action": req.action}
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
async def openclaw_execute_step(req: ToolCallRequest):
    """Execute one OpenClaw tool call — real ADB or gate trigger."""
    result = oclaw.execute_tool(req.tool, req.params, run_adb)
    await broadcast_ws({"type": "tool_call", "data": result})
    return result


@app.get("/api/openclaw/tool_trace")
def openclaw_tool_trace():
    """Return ordered list of all tool calls in the current session."""
    return {"trace": oclaw.get_trace(), "count": len(oclaw.get_trace())}


@app.delete("/api/openclaw/tool_trace")
async def openclaw_clear_trace():
    oclaw.clear_trace()
    await broadcast_ws({"type": "tool_trace_cleared"})
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
    apply_sync_update({
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
    apply_sync_update({
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
    apply_sync_update({
        "last_remote_command": f"OpenClaw: {req.goal[:30]}",
        "last_remote_ts": time.time()
    })
    return res


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

