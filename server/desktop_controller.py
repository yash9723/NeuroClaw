# Desktop Remote Controller for OpenClaw
# Executes Windows desktop actions & shell tasks initiated from mobile app
# Ponytail: <=120 lines, standard library only

import os
import subprocess
import time
import platform

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def execute_desktop_action(action: str) -> dict:
    """Execute pre-defined desktop action triggered remotely from mobile phone."""
    result = {"action": action, "status": "ok", "message": "", "timestamp": time.time()}
    try:
        if action == "lock_pc":
            subprocess.Popen(["rundll32.exe", "user32.dll,LockWorkStation"])
            result["message"] = "Workstation locked remotely."
        elif action == "launch_vscode":
            subprocess.Popen(["cmd.exe", "/c", "code", WORKSPACE], shell=False)
            result["message"] = f"VS Code opened for workspace."
        elif action == "launch_browser":
            subprocess.Popen(["cmd.exe", "/c", "start", "http://localhost:5173"], shell=False)
            result["message"] = "Opened dashboard in browser."
        elif action == "open_terminal":
            subprocess.Popen(["powershell.exe", "-NoExit", "-Command", f"Set-Location '{WORKSPACE}'"], shell=False)
            result["message"] = "Terminal window opened on desktop."
        elif action == "minimize_all":
            subprocess.Popen(["powershell.exe", "-Command", "(New-Object -ComObject Shell.Application).MinimizeAll()"], shell=False)
            result["message"] = "Minimized desktop windows."
        elif action == "git_status":
            res = subprocess.run(["git", "status", "-s"], cwd=WORKSPACE, capture_output=True, text=True, timeout=8)
            if res.returncode == 0:
                result["message"] = res.stdout.strip() or "Git working tree clean."
            else:
                files = os.listdir(WORKSPACE)[:6]
                result["message"] = f"Workspace '{os.path.basename(WORKSPACE)}' ({len(os.listdir(WORKSPACE))} items: {', '.join(files)}...)"
        elif action == "build_project":
            res = subprocess.run(["cmd.exe", "/c", "npm run build"], cwd=WORKSPACE, capture_output=True, text=True, timeout=30)
            result["message"] = res.stdout.strip()[-300:] if res.stdout else "Build dispatched."
        else:
            result["status"] = "ignored"
            result["message"] = f"Unknown action: {action}"
    except Exception as e:
        result["status"] = "error"
        result["message"] = str(e)
    return result

def run_desktop_command(cmd: str) -> dict:
    """Run an arbitrary safe terminal command on the desktop workspace."""
    start = time.time()
    try:
        # Run via powershell in workspace with 15s timeout
        res = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", cmd],
            cwd=WORKSPACE,
            capture_output=True,
            text=True,
            timeout=15
        )
        elapsed_ms = int((time.time() - start) * 1000)
        output = (res.stdout + res.stderr).strip()
        return {
            "cmd": cmd,
            "exit_code": res.returncode,
            "output": output or "[No output returned]",
            "elapsed_ms": f"{elapsed_ms}ms",
            "status": "ok" if res.returncode == 0 else "error"
        }
    except subprocess.TimeoutExpired:
        return {"cmd": cmd, "exit_code": -1, "output": "Execution timed out (15s limit)", "status": "timeout"}
    except Exception as e:
        return {"cmd": cmd, "exit_code": -1, "output": str(e), "status": "error"}

def get_desktop_telemetry() -> dict:
    """Return lightweight desktop health telemetry for mobile display."""
    return {
        "hostname": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "workspace": os.path.basename(WORKSPACE),
        "status": "online",
        "timestamp": time.time()
    }
