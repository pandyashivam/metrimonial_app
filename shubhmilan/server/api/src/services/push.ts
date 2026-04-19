/* eslint-disable no-console */
import { prisma } from '../db.js';
import { env } from '../env.js';

/**
 * Expo Push sender. Expo Push accepts the same token format for iOS (APNs) and Android (FCM)
 * and handles platform routing upstream, so we have one codepath for both.
 *
 * Categories:
 *   new_interest         — someone sent you an interest
 *   interest_accepted    — they accepted your interest
 *   new_message          — new chat message (body is encrypted; we only surface sender name)
 *   profile_viewed       — premium: someone viewed your profile
 *   premium_match        — AI produced a new high-score match
 *   verification_approved — manual KYC step approved
 */

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

/** Send a notification to every registered device for a user. Fire-and-forget. */
export async function sendPush(p: PushPayload): Promise<void> {
  const devices = await prisma.device.findMany({
    where: { userId: p.userId },
    select: { fcmToken: true, platform: true, id: true },
  });
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
      console.warn('[push] HTTP', res.status, await res.text());
      return;
    }
    const json = (await res.json()) as {
      data?: Array<{ status: 'ok' | 'error'; message?: string; details?: { error?: string } }>;
    };
    // Expo returns per-message status. Device errors like DeviceNotRegistered mean we should
    // prune the token so we stop pestering a dead device.
    const results = json.data ?? [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r?.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
        const id = devices[i]?.id;
        if (id) await prisma.device.delete({ where: { id } }).catch(() => null);
      }
    }
  } catch (err) {
    console.warn('[push] send failed', err);
  }
}

// ---------- Convenience helpers ----------

export async function pushNewInterest(recipientUserId: string, fromName: string) {
  return sendPush({
    userId: recipientUserId,
    category: 'new_interest',
    title: `${fromName} sent you an interest`,
    body: `Open ShubhMilan to accept, decline or view their profile.`,
    data: { type: 'new_interest' },
  });
}

export async function pushInterestAccepted(senderUserId: string, byName: string) {
  return sendPush({
    userId: senderUserId,
    category: 'interest_accepted',
    title: `${byName} accepted your interest 💐`,
    body: `You can now chat — every message is end-to-end encrypted.`,
    data: { type: 'interest_accepted' },
  });
}

export async function pushNewMessage(recipientUserId: string, fromName: string, conversationId: string) {
  // IMPORTANT: We never include the decrypted message content in the push payload — the
  // server can't see it anyway (E2E), and even if it could, push notification transports
  // aren't end-to-end encrypted. Show sender + "new message" only.
  return sendPush({
    userId: recipientUserId,
    category: 'new_message',
    title: fromName,
    body: `New message`,
    data: { type: 'new_message', conversationId },
  });
}

export async function pushProfileViewed(viewedUserId: string) {
  return sendPush({
    userId: viewedUserId,
    category: 'profile_viewed',
    title: 'Someone viewed your profile',
    body: `Upgrade to Premium to see who's interested.`,
    data: { type: 'profile_viewed' },
  });
}

export async function pushVerificationApproved(userId: string, step: string) {
  return sendPush({
    userId,
    category: 'verification_approved',
    title: 'Verification approved ✓',
    body: `Your ${step} step is verified. Your trust score just went up.`,
    data: { type: 'verification_approved', step },
  });
}
