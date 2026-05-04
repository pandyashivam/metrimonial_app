import { Button, Card, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * WebVideoRecorder — browser-side video KYC recorder.
 *
 *   • Uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder`.
 *   • Renders a native <video> element via createElement + ref so we get the
 *     real preview surface (react-native-web doesn't expose <video>).
 *   • Hard-caps recordings at 30s; the UI advances a progress bar in real time.
 *   • On stop, hands the resulting Blob to `onRecorded(blob, mime)` for upload.
 *
 * Native (iOS/Android) screens should NOT import this module — it pulls in DOM
 * APIs unconditionally. The parent screen branches on Platform.OS.
 */

interface Props {
  onRecorded: (blob: Blob, mime: string) => void;
  onCancel: () => void;
  /** Max recording length in seconds. Default 30. */
  maxSeconds?: number;
}

type Phase = 'idle' | 'preview' | 'recording' | 'recorded' | 'denied' | 'unsupported';

export function WebVideoRecorder({ onRecorded, onCancel, maxSeconds = 30 }: Props) {
  const videoHostRef = useRef<View | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    'MediaRecorder' in window;

  // Mount a real <video> element inside the RN host view. We do this via DOM so
  // we get the actual `srcObject` API; react-native-web's <Video> wrapper does
  // not surface that.
  useEffect(() => {
    if (!supported) {
      setPhase('unsupported');
      return;
    }
    const host = (videoHostRef.current as unknown as HTMLElement | null);
    if (!host || typeof document === 'undefined') return;
    const el = document.createElement('video');
    el.autoplay = true;
    el.muted = true;
    el.playsInline = true;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    el.style.backgroundColor = '#000';
    el.style.borderRadius = '14px';
    host.appendChild(el);
    videoElRef.current = el;
    return () => {
      el.remove();
      videoElRef.current = null;
    };
  }, [supported]);

  const teardownStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoElRef.current) videoElRef.current.srcObject = null;
  }, []);

  const requestPreview = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoElRef.current) videoElRef.current.srcObject = stream;
      setPhase('preview');
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPhase('denied');
      } else {
        setError(e.message ?? 'Could not access camera');
        setPhase('idle');
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMimeType();
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const finalMime = recorder.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: finalMime });
      chunksRef.current = [];
      teardownStream();
      setPhase('recorded');
      onRecorded(blob, finalMime);
    };
    recorder.start();
    setElapsed(0);
    setPhase('recording');
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(s);
      if (s >= maxSeconds) stopRecording();
    }, 250);
  }, [maxSeconds, onRecorded, teardownStream]);

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      teardownStream();
    };
  }, [teardownStream]);

  if (phase === 'unsupported') {
    return (
      <Card>
        <Text style={styles.h1}>Browser not supported</Text>
        <Text style={styles.body}>
          Your browser doesn&apos;t support in-page video recording. Please open ShubhMilan in
          Chrome, Edge, Firefox, or Safari, or use the mobile app.
        </Text>
        <Button title="Back" variant="outline" onPress={onCancel} block />
      </Card>
    );
  }

  if (phase === 'denied') {
    return (
      <Card>
        <Text style={styles.h1}>Camera and mic permission denied</Text>
        <Text style={styles.body}>
          We need camera and microphone access to record your verification video. Please grant
          permission in your browser&apos;s site settings, then reload this page.
        </Text>
        <Button title="Back" variant="outline" onPress={onCancel} block />
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.previewWrap} ref={videoHostRef as unknown as React.Ref<View>} />
      <View style={styles.controls}>
        {phase === 'idle' && (
          <Button title="Allow camera & mic to start" onPress={requestPreview} block />
        )}
        {phase === 'preview' && (
          <Pressable
            onPress={startRecording}
            accessibilityLabel="Start recording"
            style={styles.recordBtn}
          >
            <View style={styles.recordDot} />
          </Pressable>
        )}
        {phase === 'recording' && (
          <>
            <Pressable
              onPress={stopRecording}
              accessibilityLabel="Stop recording"
              style={[styles.recordBtn, styles.recording]}
            >
              <View style={styles.stopSquare} />
            </Pressable>
            <Text style={styles.status}>
              Recording — {elapsed}s / {maxSeconds}s
            </Text>
          </>
        )}
        {phase === 'recorded' && (
          <Text style={styles.status}>Uploading recording…</Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

function pickMimeType(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return null;
}

const styles = StyleSheet.create({
  previewWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  controls: { alignItems: 'center', gap: spacing.sm },
  recordBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: { borderColor: colors.danger },
  recordDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary },
  stopSquare: { width: 26, height: 26, borderRadius: 4, backgroundColor: colors.danger },
  status: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: '500' },
  error: { fontSize: fontSizes.sm, color: colors.danger, fontWeight: '600' },
  h1: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  body: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    marginBottom: spacing.md,
  },
});
