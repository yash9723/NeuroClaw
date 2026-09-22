# Automated End-to-End Verification Test for NeuroClaw Backend
# Ponytail: <=120 lines, standard library only

import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name: str, path: str, method: str = "GET", payload: dict = None) -> bool:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            elapsed = int((time.time() - start) * 1000)
            res_json = json.loads(resp.read().decode("utf-8"))
            print(f"  [PASS] {name:<30} ({elapsed}ms) -> {resp.status} OK")
            return True
    except urllib.error.URLError as e:
        print(f"  [FAIL] {name:<30} -> {e}")
        return False
    except Exception as e:
        print(f"  [FAIL] {name:<30} -> {e}")
        return False

def main():
    print("=" * 65)
    print("  [NeuroClaw] Backend Health & Verification Suite")
    print(f"  Testing Target: {BASE_URL}")
    print("=" * 65)

    tests = [
        ("Core Health Check", "/", "GET", None),
        ("Network Topology Info", "/api/network/info", "GET", None),
        ("Hardware Device Status", "/api/device/status", "GET", None),
        ("Bi-directional Sync State", "/api/sync/state", "GET", None),
        ("Desktop Telemetry", "/api/desktop/status", "GET", None),
        ("OpenClaw Tool Trace", "/api/openclaw/tool_trace", "GET", None),
        ("OpenClaw LAM Task Plan", "/api/plan_task", "POST", {"goal": "order milk", "target_apps": ["Blinkit"]}),
        ("Desktop Git Action", "/api/desktop/action", "POST", {"action": "git_status"}),
        ("Desktop Terminal Command", "/api/desktop/command", "POST", {"command": "Get-Date"}),
        ("Bluetooth Hardware Bridge", "/api/device/bluetooth/status", "GET", None),
    ]

    passed = 0
    for name, path, method, payload in tests:
        if test_endpoint(name, path, method, payload):
            passed += 1

    print("-" * 65)
    print(f"  Results: {passed}/{len(tests)} Endpoints Passing ({int(passed/len(tests)*100)}%)")
    print("=" * 65)
    return 0 if passed == len(tests) else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
