# NeuroClaw ⚡
> **Hardware-Coupled Autonomous Action Agent & Zero-Trust Device Orchestrator**  
> Built as a progressive mobile web app and native Android APK.

---

## 🚀 Quickstart

### 1. Run the Web & Mobile Development Server
```bash
# Navigate to project directory
cd C:\Users\yashr\.gemini\antigravity\scratch\iqoo-neuroclaw

# Start Vite server (configured for 0.0.0.0 network host)
npm run dev
```

- **Desktop View:** Open [http://localhost:5173/](http://localhost:5173/)
- **Mobile Phone (Same Wi-Fi):** Open `http://<YOUR_LAPTOP_IP>:5173/` on mobile Chrome to test camera, haptics, and sensors!

---

### 2. Build the Native Android APK
The project is configured with Capacitor and native Android Gradle:

```bash
# 1. Build the production web bundle and sync to Android
npm run build
npx cap copy android

# 2. Build the Debug APK using Gradle wrapper
cd android
./gradlew assembleDebug
```

The generated APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Install on Connected Android Device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
Or transfer `app-debug.apk` to any Android phone via WhatsApp / Google Drive / USB and install directly!

---

### 3. (Optional) Run Python OpenClaw Gateway API
```bash
cd server
pip install -r requirements.txt
python agent_api.py
```
The FastAPI backend runs on `http://localhost:8000`.

---

## 📱 Core Features Tested & Working

1. **Native Android APK & Web Dual-Mode:** Runs as an installable APK or a high-performance web app.
2. **Dual-Device View:** Toggle between **Phone Handheld frame** and **Desktop Command Center** from the header.
3. **Dual-Axis Haptics:** Click any haptic test button or execute a task on a mobile phone to feel physical vibrations (`navigator.vibrate`).
4. **Zero-Trust Biometric Security Gate:**
   - Pre-Authentication notification with risk analysis.
   - Front-facing camera stream with facial geometry scan line animation.
   - 4-digit Security PIN keypad fallback (PIN: `1234`).
   - Post-Authentication audit receipt.
5. **Autonomous Cross-App Workflows:**
   - *Cross-App Communication (Gmail $\rightarrow$ WhatsApp)*
   - *Instant Quick Commerce (Blinkit 1L Milk Order)*
   - *DevOps Incident Resolution (Error Log $\rightarrow$ GitHub PR)*
6. **Speech Recognition:** Tap the microphone icon in the search bar and speak your task.
7. **OpenClaw Action Trace:** Live JSON schemas displayed in real-time under the telemetry drawer.

---

## 📁 Repository Structure
- `.agents/rules/ponytail.md` - Active Ponytail YAGNI anti-bloat ruleset
- `android/` - Full native Android Studio project and Gradle build files
- `src/` - React mobile/desktop frontend with native hardware hooks
- `skills/neuroclaw/SKILL.md` - OpenClaw skill definition
- `skills/ponytail/SKILL.md` - Ponytail OpenClaw skill
- `server/agent_api.py` - FastAPI agent server
- `docs/SUBMISSION_PORTAL_CONTENT.md` - Ready-to-copy submission texts (due Sept 22)
- `docs/PITCH_DECK.md` - Pitch presentation and technical architecture
