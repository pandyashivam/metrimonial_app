import { Button, Input, colors, fontSizes, spacing } from '@shubhmilan/ui';
import { ProfileInput } from '@shubhmilan/validation';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../src/api';
import { useOnboarding } from '../../src/onboarding-store';

/**
 * Onboarding step 1: Basics. RHF drives per-field validation + inline errors; on every
 * blur we persist back to the shared Zustand store so the user can navigate between
 * steps without losing partial progress. Final submit runs the shared Zod schema
 * (ProfileInput) so backend + client stay in lockstep.
 */

type FormValues = {
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  height: string;
  religion: string;
  caste: string;
  motherTongue: string;
  education: string;
  occupation: string;
  city: string;
  state: string;
  aboutMe: string;
};

export default function Basics() {
  const router = useRouter();
  const s = useOnboarding();
  const [serverErr, setServerErr] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: s.fullName,
      dob: s.dob,
      gender: s.gender,
      height: s.height,
      religion: s.religion,
      caste: s.caste,
      motherTongue: s.motherTongue,
      education: s.education,
      occupation: s.occupation,
      city: s.city,
      state: s.state,
      aboutMe: s.aboutMe,
    },
    mode: 'onBlur',
  });

  // Persist every change back to the store so cross-screen nav doesn't lose input.
  useEffect(() => {
    const sub = watch((values) => s.set(values as Partial<FormValues>));
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  const onSubmit = async (values: FormValues) => {
    setServerErr(null);
    // Run the shared Zod schema so we fail fast before the network call.
    const parsed = ProfileInput.safeParse({
      fullName: values.fullName,
      gender: values.gender || 'Other',
      dob: values.dob,
      height: values.height,
      maritalStatus: s.maritalStatus || 'Never Married',
      motherTongue: values.motherTongue,
      religion: values.religion,
      caste: values.caste,
      subCaste: s.subCaste || null,
      gotra: s.gotra || null,
      manglik: s.manglik || 'No',
      education: values.education,
      occupation: values.occupation,
      income: s.income || null,
      city: values.city,
      state: values.state,
      country: s.country || 'India',
      diet: s.diet || 'Vegetarian',
      smoking: s.smoking || 'No',
      drinking: s.drinking || 'No',
      aboutMe: values.aboutMe,
      familyValues: s.familyValues || 'Moderate',
      personalityTraits: s.personalityTraits,
      hobbies: s.hobbies,
      languages: s.languages,
    });
    if (!parsed.success) {
      setServerErr(parsed.error.issues[0]?.message ?? 'Check your inputs');
      return;
    }
    try {
      await api.me.updateProfile(parsed.data as never);
      router.push('/(onboarding)/family');
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : 'Could not save');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.step}>Step 1 of 6</Text>
          <Text style={styles.title}>Basics</Text>

          <Controller
            control={control}
            name="fullName"
            rules={{ required: 'Full name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full name"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="dob"
            rules={{
              required: 'DOB is required',
              pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Use YYYY-MM-DD' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Date of birth"
                required
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.dob?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="gender"
            rules={{
              required: 'Gender is required',
              validate: (v) =>
                ['Male', 'Female', 'Other'].includes(v) || 'Use Male, Female, or Other',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Gender"
                required
                placeholder="Male / Female / Other"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.gender?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="height"
            rules={{ required: 'Height is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Height"
                required
                placeholder={"e.g. 5'6\""}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.height?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="religion"
            rules={{ required: 'Religion is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Religion"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.religion?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="caste"
            rules={{ required: 'Caste is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Caste"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.caste?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="motherTongue"
            rules={{ required: 'Mother tongue is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mother tongue"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.motherTongue?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="education"
            rules={{ required: 'Education is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Education"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.education?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="occupation"
            rules={{ required: 'Occupation is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Occupation"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.occupation?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="city"
            rules={{ required: 'City is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="City"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.city?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="state"
            rules={{ required: 'State is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="State"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.state?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="aboutMe"
            rules={{
              required: 'About is required',
              minLength: { value: 40, message: 'At least 40 characters' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="About me"
                required
                multiline
                numberOfLines={5}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                hint="Min 40 characters. Our AI coach can polish this for you later."
                error={errors.aboutMe?.message}
              />
            )}
          />

          {serverErr ? <Text style={styles.err}>{serverErr}</Text> : null}
          <Button title="Continue" onPress={handleSubmit(onSubmit)} loading={isSubmitting} block />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  step: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: fontSizes.xs + 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  err: { color: colors.danger, marginBottom: spacing.sm, fontWeight: '600' },
});
