import { Platform } from 'react-native';

import { api } from './api';

/**
 * Cross-platform push registration.
 *
 *   • Native (iOS/Android): Expo Notifications → Expo Push API. The token is
 *     short and is registered as the device's `fcmToken`.
 *   • Web: Service Worker + PushManager + VAPID. The PushSubscription JSON is
 *     stringified and registered as the device's `fcmToken` (the column is
 *     overloaded for both kinds of token; the server branches on `platform`).
 *
 * Idempotent: re-registering with the same token / subscription is a no-op
 * server-side (the row gets `lastSeenAt` bumped).
 */
export async function registerForPushAsync(): Promise<boolean> {
  return Platform.OS === 'web' ? registerWebPush() : registerNativePush();
}

// ---------- Native ----------

async function registerNativePush(): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return false;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.me.registerDevice({
      fcmToken: token,
      platform: (Platform.OS === 'ios' ? 'ios' : 'android') as 'ios' | 'android',
    });
    return true;
  } catch {
    return false;
  }
}

// ---------- Web ----------

async function registerWebPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }
  const vapid = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) {
    // No VAPID key configured — skip rather than throw, so dev environments
    // without push set up don't blow up the app boot.
    return false;
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
    }
    await api.me.registerDevice({
      fcmToken: JSON.stringify(sub.toJSON()),
      platform: 'web',
    });
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[push] web registration failed', err);
    return false;
  }
}

/** Convert a base64url-encoded VAPID public key to the Uint8Array PushManager wants. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
