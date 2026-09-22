# NeuroClaw - Official Pitch Deck & Technical Manifesto

## Slide 1: Cover Slide
- **Product Title:** NeuroClaw
- **Subtitle:** The On-Device Hardware-Coupled Action Agent & Zero-Trust Android Orchestrator
- **Platform:** Native Android APK + Cross-Platform Desktop Command Center
- **Team:** Team NeuroClaw (3 Intermediate Vibe Coders)

---

## Slide 2: The Problem - The Mobile AI Paradox
- **Mobile AI today is passive:** Chatbots sit in isolated tabs and wait for text questions.
- **The Workflow Friction:** Everyday tasks require jumping between 4+ apps (Gmail, WhatsApp, Blinkit, banking apps).
- **The Security Vacuum:** Unchecked autonomous agents cannot be trusted with credit cards, UPI, or private messages without human approval.

---

## Slide 3: The Solution - NeuroClaw
- An **on-device Large Action Model (LAM)** packaged as an installable **Android APK**.
- **Perceives:** Reads on-screen UI elements using Accessibility and Screen Vision.
- **Plans:** Decomposes complex goals into atomic action steps on the Snapdragon NPU.
- **Protects:** Enforces **Zero-Trust Biometric Facial Recognition** before authorizing sensitive payloads.
- **Executes:** Synthesizes touches, inputs text, and delivers tactile haptic confirmation.

---

## Slide 4: Deep Hardware & Android Platform Synergy
- **Snapdragon NPU Acceleration:** 45 TOPS INT4 quantized local inference for sub-100ms task reasoning without battery drain.
- **Dual-Axis Linear Motor Haptics:** Custom tactile vibration profiles for planning, authentication challenges, and task success.
- **Thermal-Aware Scaling:** Reads device temperature to dynamically adjust inference models between Monster Mode (maximum speed) and Eco Mode.
- **Native Android APK Architecture:** Complete native permissions for Camera, Biometrics, Audio, and Accessibility services.

---

## Slide 5: Real-World Use Cases Demonstrated
1. **Cross-App Communication & Triage:** Reads critical bug email in Gmail $\rightarrow$ drafts formal update in WhatsApp $\rightarrow$ requires Face Auth $\rightarrow$ dispatches.
2. **Autonomous Quick Commerce:** User voice prompt (*"Order 1L Milk on Blinkit"*) $\rightarrow$ navigates store $\rightarrow$ adds to cart $\rightarrow$ requires Biometric Payment Auth $\rightarrow$ confirms delivery.
3. **DevOps Incident Auto-Healing:** Ingests server error log $\rightarrow$ diagnoses memory leak $\rightarrow$ synthesizes patch $\rightarrow$ dispatches GitHub PR and notifies team.

---

## Slide 6: The Ponytail (YAGNI) Advantage
- Enforced strict anti-bloat architecture via `.agents/rules/ponytail.md`.
- 100% native platform APIs (`navigator.vibrate`, Web Speech, MediaDevices, Biometrics) — zero third-party dependency failures during the sprint.
- Built to survive unpredictable **Red Light** (mobile-only) and **Green Light** (laptop + mobile) hackathon phases.
