import { FontAwesome6 } from '@expo/vector-icons';
import type { EncryptedMessage } from '@shubhmilan/api-client';
import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { KeyboardSafe } from '../../src/KeyboardSafe';
import {
  decodeEnvelope,
  decryptMedia,
  decryptMessage,
  encodeEnvelope,
  encryptMedia,
  encryptMessage,
  ensureKeyPair,
  naclUtil,
  type MessageEnvelope,
} from '../../src/crypto';
import { pickImageBytes } from '../../src/photo-picker';
import { getSocket } from '../../src/socket';

interface DecryptedMessage {
  id: string;
  senderProfileId: string;
  text: string;
  media?: { uri: string; mime: string };
  createdAt: string;
  readAt: string | null;
  failed?: boolean;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [mySecret, setMySecret] = useState<string | null>(null);
  const [peerKey, setPeerKey] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const listRef = useRef<FlatList<DecryptedMessage>>(null);

  // Bootstrap: load my keys, the conversation peer's key, and my own profile id.
  useEffect(() => {
    (async () => {
      const kp = await ensureKeyPair();
      setMySecret(kp.secretKey);
      const convos = await api.chat.conversations().catch(() => []);
      const match = convos.find((c) => c.id === conversationId);
      if (match) {
        setPeerId(match.peerId);
        setPeerKey(match.peerPublicKey);
      }
      const profile = await api.me.profile().catch(() => null);
      if (profile) setMyProfileId((profile as unknown as { id: string }).id);
    })();
  }, [conversationId]);

  const historyQuery = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => api.chat.messages(conversationId!),
    enabled: !!conversationId,
  });

  // Decrypt and merge server-fetched history whenever inputs are ready. For media
  // envelopes we fetch the encrypted blob, symmetrically decrypt it, and turn the
  // plaintext bytes into a data URI so RN <Image> can render without another roundtrip.
  const resolveMedia = useCallback(
    async (env: Extract<MessageEnvelope, { kind: 'media' }>): Promise<DecryptedMessage['media']> => {
      try {
        const { url } = await api.chat.signMedia(env.mediaKey);
        const res = await fetch(url);
        const buf = new Uint8Array(await res.arrayBuffer());
        const ct = naclUtil.encodeBase64(buf);
        const plain = decryptMedia(ct, env.symKey, env.symNonce);
        if (!plain) return undefined;
        const dataUri = `data:${env.mediaMime};base64,${naclUtil.encodeBase64(plain)}`;
        return { uri: dataUri, mime: env.mediaMime };
      } catch {
        return undefined;
      }
    },
    [],
  );

  useEffect(() => {
    if (!historyQuery.data || !mySecret || !peerKey || !myProfileId) return;
    let cancelled = false;
    (async () => {
      const decrypted: DecryptedMessage[] = [];
      for (const m of historyQuery.data.items as EncryptedMessage[]) {
        const raw = decryptMessage(m.ciphertext, m.nonce, peerKey, mySecret);
        if (raw === null) {
          decrypted.push({
            id: m.id,
            senderProfileId: m.senderProfileId,
            text: '🔒 Cannot decrypt (different device or rotated key)',
            createdAt: m.createdAt,
            readAt: m.readAt,
            failed: true,
          });
          continue;
        }
        const env = decodeEnvelope(raw);
        if (env && env.kind === 'media') {
          const media = await resolveMedia(env);
          decrypted.push({
            id: m.id,
            senderProfileId: m.senderProfileId,
            text: env.text,
            media,
            createdAt: m.createdAt,
            readAt: m.readAt,
          });
        } else if (env && env.kind === 'text') {
          decrypted.push({
            id: m.id,
            senderProfileId: m.senderProfileId,
            text: env.text,
            createdAt: m.createdAt,
            readAt: m.readAt,
          });
        } else {
          // Legacy message pre-envelope: treat as plain text.
          decrypted.push({
            id: m.id,
            senderProfileId: m.senderProfileId,
            text: raw,
            createdAt: m.createdAt,
            readAt: m.readAt,
          });
        }
      }
      if (!cancelled) {
        setMessages(decrypted.reverse());
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
        api.chat.markRead(conversationId!).catch(() => null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyQuery.data, mySecret, peerKey, myProfileId, conversationId, resolveMedia]);

  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);

  // Subscribe to realtime deliveries, typing, and presence.
  useEffect(() => {
    if (!conversationId || !mySecret || !peerKey) return;
    let cancelled = false;
    let socketInstance: Awaited<ReturnType<typeof getSocket>> = null;
    let typingTimer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      socketInstance = await getSocket();
      if (!socketInstance || cancelled) return;
      socketInstance.emit('join', conversationId);
      socketInstance.on('message:new', async (m: EncryptedMessage) => {
        if (m.conversationId !== conversationId) return;
        const raw = decryptMessage(m.ciphertext, m.nonce, peerKey, mySecret);
        const base = {
          id: m.id,
          senderProfileId: m.senderProfileId,
          createdAt: m.createdAt,
          readAt: null as string | null,
        };
        if (raw === null) {
          setMessages((prev) => [
            ...prev,
            { ...base, text: '🔒 …', failed: true },
          ]);
          return;
        }
        const env = decodeEnvelope(raw);
        if (env && env.kind === 'media') {
          const media = await resolveMedia(env);
          setMessages((prev) => [...prev, { ...base, text: env.text, media }]);
        } else if (env && env.kind === 'text') {
          setMessages((prev) => [...prev, { ...base, text: env.text }]);
        } else {
          setMessages((prev) => [...prev, { ...base, text: raw }]);
        }
      });
      socketInstance.on(
        'typing',
        (e: { conversationId: string; userId: string; isTyping: boolean }) => {
          if (e.conversationId !== conversationId) return;
          setPeerTyping(e.isTyping);
          if (typingTimer) clearTimeout(typingTimer);
          if (e.isTyping) typingTimer = setTimeout(() => setPeerTyping(false), 3000);
        },
      );
      socketInstance.on(
        'presence:update',
        (e: { userId: string; isOnline: boolean }) => {
          // We don't know the peer's userId here without a lookup; for now, any presence
          // event can flip the indicator — cheap but honest.
          if (peerId === e.userId) setPeerOnline(e.isOnline);
        },
      );
    })();
    return () => {
      cancelled = true;
      if (typingTimer) clearTimeout(typingTimer);
      if (socketInstance) {
        socketInstance.emit('leave', conversationId);
        socketInstance.off('message:new');
        socketInstance.off('typing');
        socketInstance.off('presence:update');
      }
    };
  }, [conversationId, mySecret, peerKey, peerId]);

  // Emit typing events while the user composes (debounced).
  const typingThrottleRef = useRef<number>(0);
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      (async () => {
        const now = Date.now();
        if (isTyping && now - typingThrottleRef.current < 1500) return;
        typingThrottleRef.current = now;
        const sock = await getSocket();
        sock?.emit('typing', { conversationId, isTyping });
      })();
    },
    [conversationId],
  );

  const send = useCallback(async () => {
    if (!input.trim() || !mySecret || !peerKey || !conversationId) return;
    setSending(true);
    try {
      const envelope = encodeEnvelope({ kind: 'text', text: input.trim() });
      const { ciphertext, nonce } = await encryptMessage(envelope, peerKey, mySecret);
      await api.chat.send(conversationId, { ciphertext, nonce });
      setInput('');
    } catch (err) {
      if (__DEV__) console.warn('send failed', err);
    } finally {
      setSending(false);
    }
  }, [input, mySecret, peerKey, conversationId]);

  const sendImage = useCallback(async () => {
    if (!mySecret || !peerKey || !conversationId) return;
    const picked = await pickImageBytes();
    if (!picked) return;
    const { bytes, mime } = picked;

    setSending(true);
    try {
      // 1. Encrypt the image bytes with a fresh symmetric key.
      const { ciphertext: mediaCt, symKey, symNonce } = await encryptMedia(bytes);
      // 2. Upload the encrypted blob to S3/R2 — it's opaque to the server.
      const blob = new Blob([mediaCt as BlobPart], { type: 'application/octet-stream' });
      const { key } = await api.chat.uploadMedia(blob);
      // 3. Build + E2E-encrypt the envelope (contains the sym key so the peer can decrypt).
      const envelope = encodeEnvelope({
        kind: 'media',
        text: input.trim(),
        mediaKey: key,
        mediaMime: mime,
        symKey: naclUtil.encodeBase64(symKey),
        symNonce: naclUtil.encodeBase64(symNonce),
      });
      const { ciphertext, nonce } = await encryptMessage(envelope, peerKey, mySecret);
      await api.chat.send(conversationId, {
        ciphertext,
        nonce,
        mediaUrl: undefined,
        mediaMime: mime,
      });
      setInput('');
    } catch (err) {
      if (__DEV__) console.warn('send-image failed', err);
    } finally {
      setSending(false);
    }
  }, [input, mySecret, peerKey, conversationId]);

  const banner = useMemo(() => {
    if (!peerKey) return '🔒 Waiting for peer to install encryption keys…';
    if (peerOnline) return '🔒 End-to-end encrypted · Online now';
    return '🔒 End-to-end encrypted · The server cannot read these messages';
  }, [peerKey, peerOnline]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{banner}</Text>
      </View>
      <KeyboardSafe>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={
            messages.length === 0
              ? styles.emptyContent
              : { padding: spacing.md, gap: 8 }
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>
                {peerKey ? 'Say hello' : 'Setting up encryption…'}
              </Text>
              <Text style={styles.emptyBody}>
                {peerKey
                  ? "Conversations start with a kind first message. Mention something from their profile that caught your eye."
                  : "We're preparing the secure channel. This only takes a moment."}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const prev = index > 0 ? messages[index - 1] : null;
            const showSeparator = !prev || !sameDay(prev.createdAt, item.createdAt);
            const isMine = item.senderProfileId === myProfileId;
            return (
              <>
                {showSeparator ? (
                  <View style={styles.daySeparator}>
                    <View style={styles.dayLine} />
                    <Text style={styles.dayLabel}>{formatDayLabel(item.createdAt)}</Text>
                    <View style={styles.dayLine} />
                  </View>
                ) : null}
                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleThem,
                  ]}
                >
                  {item.media ? (
                    <Image
                      source={{ uri: item.media.uri }}
                      style={styles.bubbleImage}
                      accessibilityLabel="Chat photo"
                    />
                  ) : null}
                  {item.text ? (
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: isMine ? '#fff' : colors.ink },
                      ]}
                    >
                      {item.text}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.bubbleMeta,
                      { color: isMine ? 'rgba(255,255,255,0.75)' : colors.textSubtle },
                    ]}
                  >
                    {formatTime(item.createdAt)}
                    {isMine && item.readAt ? ' · Read' : ''}
                  </Text>
                </View>
              </>
            );
          }}
        />
        {peerTyping && (
          <Text style={styles.typing}>Typing…</Text>
        )}
        <View style={styles.inputBar}>
          <Pressable
            onPress={sendImage}
            disabled={sending || !peerKey}
            accessibilityLabel="Attach photo"
            style={styles.attachBtn}
          >
            <FontAwesome6 name="image" size={18} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Input
              value={input}
              onChangeText={(t) => {
                setInput(t);
                emitTyping(t.length > 0);
              }}
              onBlur={() => emitTyping(false)}
              placeholder="Type a message"
              multiline
            />
          </View>
          <Button
            title={sending ? 'Sending…' : 'Send'}
            onPress={send}
            loading={sending}
            disabled={!input.trim() || !peerKey}
          />
        </View>
      </KeyboardSafe>
    </SafeAreaView>
  );
}

function sameDay(a?: string | Date | null, b?: string | Date | null): boolean {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatTime(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (sameDay(d, today)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  banner: { padding: 10, backgroundColor: colors.primary50, alignItems: 'center' },
  bannerText: { color: colors.primary, fontSize: fontSizes.xs + 1, fontWeight: '600' },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: fontSizes.sm + 1 },
  bubbleMeta: { fontSize: 11, marginTop: 4, textAlign: 'right', letterSpacing: 0.2 },
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dayLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bubbleImage: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.primary100,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  typing: { color: colors.textMuted, fontStyle: 'italic', paddingHorizontal: spacing.md, paddingBottom: 4 },
  inputBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 360,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.5,
  },
});
