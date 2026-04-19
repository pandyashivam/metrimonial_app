import type { EncryptedMessage } from '@shubhmilan/api-client';
import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { decryptMessage, encryptMessage, ensureKeyPair } from '../../src/crypto';
import { getSocket } from '../../src/socket';

interface DecryptedMessage {
  id: string;
  senderProfileId: string;
  text: string;
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

  // Decrypt and merge server-fetched history whenever inputs are ready.
  useEffect(() => {
    if (!historyQuery.data || !mySecret || !peerKey || !myProfileId) return;
    const decrypted: DecryptedMessage[] = [];
    for (const m of historyQuery.data.items as EncryptedMessage[]) {
      // For messages I sent, the peer's public key is also the "other" party's key.
      const otherKey = peerKey;
      const text = decryptMessage(m.ciphertext, m.nonce, otherKey, mySecret);
      decrypted.push({
        id: m.id,
        senderProfileId: m.senderProfileId,
        text: text ?? '🔒 Cannot decrypt (different device or rotated key)',
        createdAt: m.createdAt,
        readAt: m.readAt,
        failed: text === null,
      });
    }
    // History arrives newest-first; we reverse for chronological display.
    setMessages(decrypted.reverse());
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    // Mark as read on open.
    api.chat.markRead(conversationId!).catch(() => null);
  }, [historyQuery.data, mySecret, peerKey, myProfileId, conversationId]);

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
      socketInstance.on('message:new', (m: EncryptedMessage) => {
        if (m.conversationId !== conversationId) return;
        const text = decryptMessage(m.ciphertext, m.nonce, peerKey, mySecret);
        setMessages((prev) => [
          ...prev,
          {
            id: m.id,
            senderProfileId: m.senderProfileId,
            text: text ?? '🔒 …',
            createdAt: m.createdAt,
            readAt: null,
            failed: text === null,
          },
        ]);
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
      const { ciphertext, nonce } = await encryptMessage(input.trim(), peerKey, mySecret);
      await api.chat.send(conversationId, { ciphertext, nonce });
      setInput('');
    } catch (err) {
      console.warn('send failed', err);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.senderProfileId === myProfileId ? styles.bubbleMine : styles.bubbleThem,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: item.senderProfileId === myProfileId ? '#fff' : colors.ink },
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />
        {peerTyping && (
          <Text style={styles.typing}>Typing…</Text>
        )}
        <View style={styles.inputBar}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
});
