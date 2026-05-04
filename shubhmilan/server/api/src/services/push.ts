/* eslint-disable no-console */
import webpush from 'web-push';

import { NotificationPref, Device } from '../db.js';
import { env } from '../env.js';

export type NotificationCategory =
  | 'new_interest'
  | 'interest_accepted'
  | 'new_message'
  | 'profile_viewed'
  | 'premium_match'
  | 'verification_approved';

export interface PushPayload {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  priority?: 'high' | 'normal';
  channelId?: string;
}

const CATEGORY_FIELD: Record<NotificationCategory, keyof NotificationPref> = {
  new_interest: 'newInterest',
  interest_accepted: 'interestAccepted',
  new_message: 'newMessage',
  profile_viewed: 'profileViewed',
  premium_match: 'premiumMatch',
  verification_approved: 'verificationApproved',
};

// VAPID is optional — when keys aren't configured (dev environments) web push
// silently no-ops while native push continues to work.
const webPushReady = !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
if (webPushReady) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function sendPush(p: PushPayload): Promise<void> {
  const prefs = await NotificationPref.findOne({ where: { userId: p.userId } });
  if (prefs) {
    const field = CATEGORY_FIELD[p.category];
    if (prefs[field] === false) return;
  }

  const devices = await Device.findAll({
    where: { userId: p.userId },
    attributes: ['fcmToken', 'platform', 'id'],
  });
  if (devices.length === 0) return;

  const webDevices = devices.filter((d) => d.platform === 'web');
  const nativeDevices = devices.filter((d) => d.platform === 'ios' || d.platform === 'android');

  await Promise.all([
    sendToWeb(p, webDevices),
    sendToNative(p, nativeDevices),
  ]);
}

// ---------- Native (Expo push) ----------

async function sendToNative(p: PushPayload, devices: Device[]): Promise<void> {
  if (devices.length === 0) return;

  const messages: ExpoMessage[] = devices.map((d) => ({
    to: d.fcmToken,
    title: p.title,
    body: p.body,
    data: { ...p.data, category: p.category },
    sound: 'default',
    priority: 'high',
    channelId: p.category,
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
        ...(env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn('[push] Expo HTTP', res.status, await res.text());
      return;
    }
    const json = (await res.json()) as {
      data?: Array<{ status: 'ok' | 'error'; message?: string; details?: { error?: string } }>;
    };
    const results = json.data ?? [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r?.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
        const id = devices[i]?.id;
        if (id) await Device.destroy({ where: { id } }).catch(() => null);
      }
    }
  } catch (err) {
    console.warn('[push] Expo send failed', err);
  }
}

// ---------- Web (Web Push / VAPID) ----------

async function sendToWeb(p: PushPayload, devices: Device[]): Promise<void> {
  if (devices.length === 0) return;
  if (!webPushReady) {
    console.warn('[push] web devices present but VAPID not configured — skipping');
    return;
  }

  const payload = JSON.stringify({
    title: p.title,
    body: p.body,
    data: { ...p.data, category: p.category },
  });

  await Promise.all(
    devices.map(async (device) => {
      let subscription: webpush.PushSubscription;
      try {
        subscription = JSON.parse(device.fcmToken);
      } catch {
        // Malformed subscription — drop it so it doesn't keep failing forever.
        await Device.destroy({ where: { id: device.id } }).catch(() => null);
        return;
      }
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 24 });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404 / 410 mean the subscription is gone — clean up.
        if (code === 404 || code === 410) {
          await Device.destroy({ where: { id: device.id } }).catch(() => null);
        } else {
          console.warn('[push] web send failed', code, err);
        }
      }
    }),
  );
}

export async function pushNewInterest(recipientUserId: string, fromName: string) {
  return sendPush({
    userId: recipientUserId,
    category: 'new_interest',
    title: `${fromName} sent you an interest`,
    body: `Open ShubhMilan to accept, decline or view their profile.`,
    data: { type: 'new_interest', url: '/matches' },
  });
}

export async function pushInterestAccepted(senderUserId: string, byName: string) {
  return sendPush({
    userId: senderUserId,
    category: 'interest_accepted',
    title: `${byName} accepted your interest`,
    body: `You can now chat — every message is end-to-end encrypted.`,
    data: { type: 'interest_accepted', url: '/messages' },
  });
}

export async function pushNewMessage(recipientUserId: string, fromName: string, conversationId: string) {
  return sendPush({
    userId: recipientUserId,
    category: 'new_message',
    title: fromName,
    body: `New message`,
    data: { type: 'new_message', conversationId, url: `/chat/${conversationId}`, tag: `chat-${conversationId}` },
  });
}

export async function pushProfileViewed(viewedUserId: string) {
  return sendPush({
    userId: viewedUserId,
    category: 'profile_viewed',
    title: 'Someone viewed your profile',
    body: `Upgrade to Premium to see who's interested.`,
    data: { type: 'profile_viewed', url: '/me' },
  });
}

export async function pushVerificationApproved(userId: string, step: string) {
  return sendPush({
    userId,
    category: 'verification_approved',
    title: 'Verification approved',
    body: `Your ${step} step is verified. Your trust score just went up.`,
    data: { type: 'verification_approved', step, url: '/me' },
  });
}
