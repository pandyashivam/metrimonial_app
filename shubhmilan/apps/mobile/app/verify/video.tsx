import { FontAwesome6 } from '@expo/vector-icons';
import { Button, Card, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';

/**
 * Video KYC — the user records a short recorded prompt ("Please confirm your name and
 * city for verification") which is then uploaded and queued for admin review. Recording
 * is done via expo-camera v15 (the old expo-camera/legacy module is removed).
 *
 * Web does not support CameraView.recordAsync() fully — on web we surface a fallback UI
 * pointing users at the mobile app.
 */
export default function VideoKyc() {
  const router = useRouter();
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const start = useCallback(async () => {
    if (!cameraRef.current) return;
    if (!cameraPerm?.granted) {
      const p = await requestCameraPerm();
      if (!p.granted) return;
    }
    if (!micPerm?.granted) {
      const p = await requestMicPerm();
      if (!p.granted) return;
    }
    haptics.medium();
    setRecording(true);
    try {
      // Max 30s, 480p is plenty for identity confirmation.
      const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
      if (!video?.uri) return;
      setSubmitting(true);
      // Upload the raw file via the chat-media endpoint for now — it's reused
      // storage. A dedicated /me/verification/video/upload endpoint is a future
      // refinement; for the admin queue we just need a retrievable key.
      const res = await fetch(video.uri);
      const blob = await res.blob();
      const uploaded = await api.chat.uploadMedia(blob);
      await api.verification.submitVideo();
      // TODO: attach `uploaded.key` to the verification row once the endpoint accepts it.
      void uploaded;
      haptics.success();
      setDone(true);
    } catch (err) {
      console.warn('video kyc failed', err);
      haptics.error();
    } finally {
      setRecording(false);
      setSubmitting(false);
    }
  }, [cameraPerm, micPerm, requestCameraPerm, requestMicPerm]);

  const stop = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Card>
          <Text style={styles.h1}>Video KYC</Text>
          <Text style={styles.sub}>
            Recording video for verification requires the mobile app. Please open ShubhMilan
            on your phone and visit Verification → Video KYC.
          </Text>
        </Card>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Card>
          <Text style={styles.h1}>Thanks — your video is in the queue</Text>
          <Text style={styles.sub}>
            A reviewer will confirm your identity within 24 hours. You&apos;ll get a push
            notification once approved. Your trust score will update automatically.
          </Text>
          <Button title="Back to verification" onPress={() => router.back()} block />
        </Card>
      </SafeAreaView>
    );
  }

  if (!cameraPerm || !micPerm) return null;
  const needsPermission = !cameraPerm.granted || !micPerm.granted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={styles.prompt}>
        <Text style={styles.promptText}>
          Please state your full name and city, and say &quot;I&apos;m joining ShubhMilan today.&quot;
        </Text>
      </View>
      {needsPermission ? (
        <View style={styles.permWrap}>
          <Text style={styles.permText}>
            Camera and microphone permission are required to record your verification video.
          </Text>
          <Button
            title="Grant permissions"
            onPress={async () => {
              await requestCameraPerm();
              await requestMicPerm();
            }}
          />
        </View>
      ) : (
        <CameraView
          ref={(r) => {
            cameraRef.current = r;
          }}
          style={styles.camera}
          facing="front"
          mode="video"
        />
      )}
      <View style={styles.controls}>
        {recording ? (
          <Pressable onPress={stop} style={[styles.recordBtn, styles.recording]} accessibilityLabel="Stop recording">
            <FontAwesome6 name="stop" color="#fff" size={22} />
          </Pressable>
        ) : (
          <Pressable
            onPress={start}
            disabled={needsPermission || submitting}
            style={styles.recordBtn}
            accessibilityLabel="Start recording"
          >
            <FontAwesome6 name="circle" color="#fff" size={26} />
          </Pressable>
        )}
        <Text style={styles.status}>
          {submitting ? 'Uploading…' : recording ? 'Recording — tap to stop' : 'Tap the button to start (max 30s)'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  prompt: { padding: spacing.md, backgroundColor: '#000' },
  promptText: { color: '#fff', fontSize: fontSizes.sm + 1, textAlign: 'center' },
  camera: { flex: 1 },
  permWrap: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  permText: { color: '#fff', textAlign: 'center', fontSize: fontSizes.sm + 1 },
  controls: { padding: spacing.lg, alignItems: 'center', gap: spacing.md, backgroundColor: '#000' },
  recordBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: { backgroundColor: colors.danger },
  status: { color: '#fff', fontSize: fontSizes.xs + 1 },
  h1: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  sub: { color: colors.textMuted, marginBottom: spacing.md },
});
