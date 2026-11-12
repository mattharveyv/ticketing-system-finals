import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    student_id: '',
    college: '',
    program: '',
    year_level: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleRegister() {
    setSubmitting(true);
    setError('');

    try {
      await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        student_id: form.student_id.trim(),
        college: form.college.trim(),
        program: form.program.trim(),
        year_level: form.year_level.trim(),
      });
      router.replace('/(app)/tickets');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  const requiredFieldsFilled =
    form.name.trim() &&
    form.email.trim() &&
    form.student_id.trim() &&
    form.college.trim() &&
    form.password.length >= 8 &&
    form.password === form.password_confirmation;

  return (
    <Page>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>MSEUF STUDENT SUPPORT</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Set up your student profile to start sending support requests.
          </Text>

          <View style={styles.card}>
            <Field label="Full name" onChangeText={(value) => update('name', value)} value={form.name} />
            <Field
              autoCapitalize="none"
              keyboardType="email-address"
              label="School email"
              onChangeText={(value) => update('email', value)}
              value={form.email}
            />
            <Field label="Student ID" onChangeText={(value) => update('student_id', value)} value={form.student_id} />
            <Field label="College" onChangeText={(value) => update('college', value)} value={form.college} />
            <Field label="Program / course (optional)" onChangeText={(value) => update('program', value)} value={form.program} />
            <Field label="Year level (optional)" onChangeText={(value) => update('year_level', value)} value={form.year_level} />
            <Field
              autoCapitalize="none"
              label="Password (at least 8 characters)"
              onChangeText={(value) => update('password', value)}
              secureTextEntry
              value={form.password}
            />
            <Field
              autoCapitalize="none"
              label="Confirm password"
              onChangeText={(value) => update('password_confirmation', value)}
              secureTextEntry
              value={form.password_confirmation}
            />
            {error ? <ErrorMessage message={error} /> : null}
            <PrimaryButton
              title="Create account"
              onPress={() => void handleRegister()}
              loading={submitting}
              disabled={!requiredFieldsFilled}
            />
            <Text style={styles.switchText}>
              Already registered?{' '}
              <Link href="/(auth)/login" style={styles.link}>
                Sign in
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  eyebrow: {
    marginTop: 10,
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginBottom: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    gap: 15,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  switchText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  link: {
    color: colors.green,
    fontWeight: '800',
  },
});
