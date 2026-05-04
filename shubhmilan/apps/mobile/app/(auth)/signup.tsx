import {
  Button,
  Input,
  PasswordInput,
  colors,
  fonts,
  fontSizes,
  spacing,
} from '@shubhmilan/ui';
import { SignupInput } from '@shubhmilan/validation';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { KeyboardSafe } from '../../src/KeyboardSafe';

interface FormValues {
  email: string;
  phone: string;
  password: string;
}

/**
 * Signup — create-account screen.
 *
 * Field-level rules + the shared Zod schema run on submit so the same checks
 * the server enforces appear here too. We surface server errors in a banner
 * above the submit button so they're impossible to miss.
 */
export default function Signup() {
  const router = useRouter();
  const [serverErr, setServerErr] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', phone: '+91', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: FormValues) => {
    setServerErr(null);
    const parsed = SignupInput.safeParse(values);
    if (!parsed.success) {
      setServerErr(parsed.error.issues[0]?.message ?? 'Please check your details and try again.');
      return;
    }
    try {
      await api.auth.signup(parsed.data);
      router.push({
        pathname: '/(auth)/otp',
        params: { target: values.phone, purpose: 'SIGNUP' },
      });
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Signup failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.frame}>
            <Text style={styles.kicker}>Get started</Text>
            <Text style={styles.title}>Create your free profile</Text>
            <Text style={styles.sub}>
              Verified profiles only. We&apos;ll send a one-time code to confirm your phone.
            </Text>

            {serverErr ? (
              <View style={styles.banner} accessibilityLiveRegion="polite">
                <Text style={styles.bannerText}>{serverErr}</Text>
              </View>
            ) : null}

            <View style={styles.fields}>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    returnKeyType="next"
                  />
                )}
              />
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: 'Phone is required',
                  pattern: { value: /^\+?[1-9]\d{9,14}$/, message: 'Enter a valid phone number' },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Phone"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                    hint="Include country code"
                    error={errors.phone?.message}
                    returnKeyType="next"
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' },
                  validate: (v) =>
                    (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) ||
                    'Mix upper/lower case and a number',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    label="Password"
                    required
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    hint="Use upper/lowercase letters and a number"
                    error={errors.password?.message}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
            </View>

            <Button
              title="Continue"
              size="lg"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              block
            />

            <Text style={styles.legal}>
              By continuing you agree to our Terms and Privacy Policy.
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={6}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardSafe>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  frame: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  kicker: {
    color: colors.accentDark,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Platform.OS === 'web' ? `${fonts.display}, Georgia, serif` : fonts.display,
    color: colors.ink,
    fontWeight: '700',
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * 1.15,
    marginTop: spacing.xs,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  banner: {
    backgroundColor: colors.danger50,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { color: colors.danger, fontSize: fontSizes.sm, fontWeight: '500' },
  fields: { marginBottom: spacing.md },
  legal: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: fontSizes.xs * 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  footerText: { color: colors.textMuted, fontSize: fontSizes.sm },
  footerLink: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700' },
});
