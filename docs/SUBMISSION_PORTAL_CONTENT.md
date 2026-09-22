# AI Model Hackathon Online Submission Package
**Deadline:** Submit Before September 22, 2026  
**Target Event:** 30-Hour Offline Sprint (Sept 26–27, 2026)

---

### Field 1: Idea Title
**NeuroClaw: Hardware-Coupled Autonomous Device Action Agent & Zero-Trust Mobile Orchestrator**

---

### Field 2: Idea Description
Modern mobile AI assistants are passive chatbots trapped inside isolated conversational windows. When users want to complete real-world tasks—such as triaging a client email, sending a confirmed update on WhatsApp, ordering groceries on Blinkit, or debugging an incident—they must manually switch between multiple apps, copy-pasting data and tapping dozens of times.

**NeuroClaw** transforms the smartphone from a passive assistant into an active **Large Action Model (LAM)**. Delivered both as a high-performance web dashboard and an installable native **Android APK**, NeuroClaw operates through native Android Accessibility and Screen Perception, reasoning over on-screen UI elements and autonomously executing multi-step cross-application workflows with zero human friction.

To prevent unauthorized actions, NeuroClaw pioneers a **Zero-Trust Biometric Security Gate (Human-in-the-Loop)**. For sensitive operations (payment authorization, outbound social messaging, critical file operations), the agent temporarily pauses execution and demands real-time facial recognition verification or an encrypted 4-digit PIN, issuing explicit Pre-Authentication and Post-Authentication receipts.

Designed specifically for mobile hardware efficiency, NeuroClaw leverages on-device Snapdragon NPU acceleration (INT4 quantized execution for sub-100ms task reasoning), dual-axis linear haptic feedback for tactile action confirmations, and dynamic thermal-adaptive throttling to deliver continuous, maximum-efficiency performance.

---

### Field 3: Video Walkthrough URL
`https://youtu.be/YOUR_DEMO_VIDEO_LINK` *(Record using the built-in Walkthrough Helper in the app)*

#### 60-Second Video Script:
- **0:00 - 0:15 (The Problem):** Demonstrate the pain of manual cross-app context switching (checking an email, opening WhatsApp, typing a summary, then opening Blinkit to order groceries).
- **0:15 - 0:45 (Live Autonomous Action & Face Auth):** Trigger NeuroClaw via voice command: *"Summarize my latest email and message Alex on WhatsApp, then order 1L milk on Blinkit."* Show the agent automatically inspecting the screen, navigating to WhatsApp, drafting the text, and triggering the **Zero-Trust Biometric Gate**. Show the user glancing at the front camera, instant face match verification (99.2%), and the triumphant haptic pulse upon dispatch.
- **0:45 - 1:00 (Hardware Integration & Native Android APK):** Display the live telemetry HUD showing Snapdragon NPU TOPS throughput, battery/thermal sensor synchronization, OpenClaw cross-device laptop sync, and the native Android APK build.

---

### Field 4: Prototype & Android APK Download URL
- **Web App:** `http://localhost:5173/` (or deployed Vercel link)
- **Native Android APK:** Available in `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Field 5: Pitch Deck / Document URL
Available in project repository under `docs/PITCH_DECK.md`.

---

### Field 6: Prior Hackathon Build Plans & Team Track Record
Our team comprises 3 agile "vibe coders" with proven experience delivering winning solutions in competitive developer sprints:
- **Lead Agent Architect:** Built multi-modal agents with OpenClaw, LangGraph, and tool-calling models; specializes in LLM quantization and low-latency API orchestration.
- **Mobile & UI/UX Specialist:** Proficient in high-performance responsive web/PWA and React Native/Capacitor Android frameworks, micro-interactions, and 120Hz smooth animations.
- **Hardware & Systems Engineer:** Experienced in Android sensor APIs (MediaProjection, Accessibility, Biometrics, Audio/Haptics) and cloud-to-edge communication bridges.

Our systematic adherence to the **Ponytail (YAGNI) architectural framework** ensures lean, zero-bloat codebases that remain fully functional and easily modifiable under challenging environments (such as alternating Red Light / Green Light sprint conditions).

---

### Field 7: What Makes Our Team Stand Out for the Offline Sprint?
1. **True Hardware-Coupled Autonomy:** We did not build a generic web chatbot; we designed an agent that directly utilizes device hardware—dual-axis linear haptics, thermal monitoring, front-camera biometrics, and Snapdragon NPU compute.
2. **Native Android APK Ready:** Our solution compiles directly to an installable Android APK, granting deep platform access to Accessibility services, background listeners, and on-device hardware.
3. **Dual-Environment Resilience:** Our hybrid architecture is immune to unpredictable "Red Light" mobile-only constraints. During mobile-only phases, the entire solution can be controlled, tested, and prompted directly on handheld devices without laptop dependency.
4. **Enterprise Zero-Trust Security:** While competitor agents suffer from "hallucinated actions" and security risks, our biometric facial recognition gate guarantees human-in-the-loop safety for high-stakes financial and communication tasks.
