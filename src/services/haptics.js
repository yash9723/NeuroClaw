// Mobile Dual-Axis Linear Motor Haptic Service
// Hybrid Native Android Capacitor Haptics + Web Vibration API fallback

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const triggerHaptic = async (type = 'click') => {
  // 1. Try Native Capacitor Haptics (Physical Android Vibration Motor)
  try {
    switch (type) {
      case 'monsterPulse':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(async () => {
          try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch (_) {}
        }, 120);
        return true;

      case 'authChallenge':
        await Haptics.notification({ type: NotificationType.Warning });
        return true;

      case 'taskComplete':
        await Haptics.notification({ type: NotificationType.Success });
        return true;

      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        return true;

      case 'stepTick':
        await Haptics.impact({ style: ImpactStyle.Light });
        return true;

      case 'click':
      default:
        await Haptics.impact({ style: ImpactStyle.Medium });
        return true;
    }
  } catch (_) {
    // 2. Fallback to Native Navigator Vibration API (for Web Browsers)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        switch (type) {
          case 'monsterPulse':
            return navigator.vibrate([60, 40, 100]);
          case 'authChallenge':
            return navigator.vibrate([120, 60, 120]);
          case 'taskComplete':
            return navigator.vibrate([80, 50, 80, 50, 160]);
          case 'error':
            return navigator.vibrate([250, 80, 250]);
          case 'stepTick':
            return navigator.vibrate(35);
          case 'click':
          default:
            return navigator.vibrate(45);
        }
      } catch (e) {
        return false;
      }
    }
  }
  return false;
};
