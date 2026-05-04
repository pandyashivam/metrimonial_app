import { Banner, Button, Input, PageFrame, ScreenHeader, spacing } from '@shubhmilan/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { api, tokenProvider } from '../../src/api';
import { useAuth } from '../../src/auth-store';
import { KeyboardSafe } from '../../src/KeyboardSafe';

type Purpose = 'SIGNUP' | 'LOGIN' | 'RESET' | 'VERIFY_EMAIL' | 'VERIFY_PHONE';

export default function Otp() {
  const { target, purpose } = useLocalSearchParams<{ target: string; purpose: Purpose }>();
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function verify() {
    setErr(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp({
        target: target!,
        code,
        purpose: (purpose ?? 'SIGNUP') as Purpose,
      });
      tokenProvider.setTokens(res.tokens);
      setUser(res.user);
      router.replace('/(tabs)/home');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That code didn\'t match. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setErr(null);
    setNotice(null);
    setResendBusy(true);
    try {
      await api.auth.resendOtp({ target: target!, purpose: (purpose ?? 'SIGNUP') as Purpose });
      setNotice('We\'ve sent you a fresh code.');
    } catch {
      setErr('We couldn\'t resend the code. Please try again in a moment.');
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <KeyboardSafe>
      <PageFrame centerVertical>
        <ScreenHeader
          kicker="Verify"
          title="Enter your code"
          subtitle={`We sent a 6-digit code to ${target ?? 'your phone'}.`}
        />
        {err ? <Banner>{err}</Banner> : null}
        {notice ? <Banner variant="success">{notice}</Banner> : null}
        <Input
          label="Verification code"
          value={code}
          onChangeText={setCode}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          returnKeyType="go"
          onSubmitEditing={verify}
        />
        <Button
          title="Verify & continue"
          size="lg"
          onPress={verify}
          loading={loading}
          disabled={code.length !== 6}
          block
        />
        <Button
          title={resendBusy ? 'Sending…' : "Didn't get it? Resend code"}
          variant="ghost"
          size="lg"
          onPress={resend}
          loading={resendBusy}
          block
          style={{ marginTop: spacing.sm }}
        />
      </PageFrame>
    </KeyboardSafe>
  );
}
