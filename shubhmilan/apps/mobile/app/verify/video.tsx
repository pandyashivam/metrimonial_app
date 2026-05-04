import { FontAwesome6 } from '@expo/vector-icons';
import {
  Banner,
  Button,
  PageFrame,
  ScreenHeader,
  colors,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { haptics } from '../../src/haptics';
import { WebVideoRecorder } from '../../src/WebVideoRecorder';

/**
 * Video KYC — the user records a short prompt confirming their identity. The
 * recording is uploaded and queued for admin review.
 *
 * Native: expo-camera v15 (`CameraView.recordAsync`).
 * Web: getUserMedia + MediaRecorder (see WebVideoRecorder.tsx).
 *
 * Both paths converge on `submitRecording(blob)` for upload — same backend
 * endpoint, same flow.
 */
export default function VideoKyc() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRecording = useCallback(async (blob: Blob) => {
    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await api.chat.uploadMedia(blob);
      await api.verification.submitVideo();
      // TODO: attach `uploaded.key` to the verification row once the endpoint accepts it.
      void uploaded;
      haptics.success();
      setDone(true);
    } catch (err) {
      if (__DEV__) console.warn('video kyc upload failed', err);
      haptics.error();
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  if (done) {
    return (
      <PageFrame centerVertical>
        <ScreenHeader
          kicker="Submitted"
          title="Thanks — your video is in the queue"
          subtitle="A reviewer will confirm your identity within 24 hours. You'll get a notification once approved, and your trust score will update automatically."
        />
        <Button title="Back to verification" size="lg" onPress={() => router.back()} block />
      </PageFrame>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <PageFrame>
        <ScreenHeader
          kicker="Step 3 — Identity"
          title="Record a short verification video"
          subtitle={'Please state your full name and city, and say "I\'m joining ShubhMilan today." Recording is capped at 30 seconds.'}
        />
        {error ? <Banner>{error}</Banner> : null}
        <WebVideoRecorder
          onRecorded={(blob) => {
            void submitRecording(blob);
          }}
          onCancel={() => router.back()}
        />
        {submitting ? <Text style={styles.uploading}>Uploading recording…</Text> : null}
      </PageFrame>
    );
  }

  return <NativeVideoKyc onRecorded={submitRecording} submitting={submitting} error={error} />;
}

// ---------- Native ----------

function NativeVideoKyc({
  onRecorded,
  submitting,
  error,
}: {
  onRecorded: (blob: Blob) => Promise<void>;
  submitting: boolean;
  error: string | null;
}) {
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [recording, setRecording] = useState(false);

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
      const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
      if (!video?.uri) return;
      const res = await fetch(video.uri);
      const blob = await res.blob();
      await onRecorded(blob);
    } catch (err) {
      if (__DEV__) console.warn('native video kyc failed', err);
      haptics.error();
    } finally {
      setRecording(false);
    }
  }, [cameraPerm, micPerm, requestCameraPerm, requestMicPerm, onRecorded]);

  const stop = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

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
          <Pressable onPress={stop} style={[styles.recordBtnNative, styles.recordingNative]} accessibilityLabel="Stop recording">
            <FontAwesome6 name="stop" color="#fff" size={22} />
          </Pressable>
        ) : (
          <Pressable
            onPress={start}
            disabled={needsPermission || submitting}
            style={styles.recordBtnNative}
            accessibilityLabel="Start recording"
          >
            <FontAwesome6 name="circle" color="#fff" size={26} />
          </Pressable>
        )}
        <Text style={styles.status}>
          {submitting ? 'Uploading…' : recording ? 'Recording — tap to stop' : 'Tap the button to start (max 30s)'}
        </Text>
        {error ? <Text style={styles.statusError}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  uploading: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // native
  prompt: { padding: spacing.md, backgroundColor: '#000' },
  promptText: { color: '#fff', fontSize: fontSizes.sm + 1, textAlign: 'center' },
  camera: { flex: 1 },
  permWrap: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  permText: { color: '#fff', textAlign: 'center', fontSize: fontSizes.sm + 1 },
  controls: { padding: spacing.lg, alignItems: 'center', gap: spacing.md, backgroundColor: '#000' },
  recordBtnNative: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingNative: { backgroundColor: colors.danger },
  status: { color: '#fff', fontSize: fontSizes.xs + 1 },
  statusError: { color: colors.danger, fontSize: fontSizes.xs + 1, fontWeight: '600' },
});
