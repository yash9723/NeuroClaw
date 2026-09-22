# Unified Backend Launcher for NeuroClaw
# Auto-resolves port conflicts, loads .env, and starts uvicorn server
# Ponytail: <=120 lines, standard library only

import os
import sys
import time
import socket
import subprocess

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SERVER_DIR)

def check_and_free_port(port: int = 8000):
    """Detect and gracefully free port and any orphaned child processes on Windows."""
    try:
        current_pid = os.getpid()
        ps_script = f"""
        Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{
            if ($_.OwningProcess -ne 0 -and $_.OwningProcess -ne {current_pid}) {{
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }}
        }}
        Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {{
            $_.Name -like 'python*' -and ($_.CommandLine -like '*server.agent_api*' -or $_.CommandLine -like '*multiprocessing.spawn*') -and $_.ProcessId -ne {current_pid}
        }} | ForEach-Object {{
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }}
        """
        subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_script], capture_output=True, text=True, timeout=8)
        time.sleep(0.5)
    except Exception as e:
        print(f"[NeuroClaw] Note on port check: {e}")

def resolve_lan_ip() -> str:
    """Detect primary LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def main():
    os.chdir(PROJECT_DIR)
    host_ip = resolve_lan_ip()
    port = int(os.environ.get("PORT", "8000"))

    print("=" * 60)
    print("  [NeuroClaw] OpenClaw Gateway Backend")
    print(f"  Host LAN IP:  http://{host_ip}:{port}")
    print(f"  Local Access: http://127.0.0.1:{port}")
    print(f"  API Docs:     http://{host_ip}:{port}/docs")
    print("=" * 60)

    check_and_free_port(port)

    if PROJECT_DIR not in sys.path:
        sys.path.insert(0, PROJECT_DIR)

    import uvicorn
    uvicorn.run(
        "server.agent_api:app",
        host="0.0.0.0",
        port=port,
        app_dir=PROJECT_DIR,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
