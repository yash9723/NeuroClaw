---
name: neuroclaw
description: Autonomous Mobile Device & Hardware-Coupled Action Agent Skill for OpenClaw.
version: 1.0.0
---

# NeuroClaw OpenClaw Skill

This skill equips the OpenClaw gateway with tools to perceive, plan, and execute multi-step native mobile workflows on Android devices via Accessibility services and MediaProjection, enforcing Zero-Trust Biometric confirmation for sensitive payloads.

## Declared Tools

### `inspect_screen`
- **Description:** Captures the active viewport geometry and accessibility node tree.
- **Parameters:**
  - `focus_app` (string, optional): Target application identifier (e.g., `com.whatsapp`, `com.grofers.customer`).
- **Returns:** Structured JSON tree of interactive elements, coordinates, and labels.

### `synthesize_touch`
- **Description:** Injects synthetic touch, scroll, or text input gestures into the target app.
- **Parameters:**
  - `action_type` (string): `tap` | `swipe` | `type_text` | `press_key`
  - `coordinates` (object): `{ "x": number, "y": number }`
  - `text` (string, optional): Text payload to inject.

### `trigger_biometric_gate`
- **Description:** Halts execution and presents a front-camera facial verification or PIN challenge to the user.
- **Parameters:**
  - `task_description` (string): Human-readable explanation of why authentication is requested.
  - `risk_level` (string): `LOW` | `MEDIUM` | `CRITICAL_FINANCIAL` | `CRITICAL_MESSAGING`
- **Returns:** `{ "verified": boolean, "timestamp": string, "audit_token": string }`

### `set_hardware_profile`
- **Description:** Sets device thermal and NPU execution mode.
- **Parameters:**
  - `profile` (string): `MONSTER_PERFORMANCE` | `ECO_BATTERY_SAVER`
