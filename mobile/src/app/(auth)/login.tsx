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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/(app)/tickets');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

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
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>M</Text>
          </View>
          <Text style={styles.eyebrow}>MSEUF STUDENT SUPPORT</Text>
          <Text style={styles.title}>Help is closer.</Text>
          <Text style={styles.subtitle}>
            Sign in to send a request and follow its progress.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student sign in</Text>
            <Field
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="School email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <Field
              autoCapitalize="none"
              autoComplete="password"
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
            />
            {error ? <ErrorMessage message={error} /> : null}
            <PrimaryButton
              title="Sign in"
              onPress={() => void handleLogin()}
              loading={submitting}
              disabled={!email.trim() || !password}
            />
            <Text style={styles.switchText}>
              New to MSEUF Help Desk?{' '}
              <Link href="/(auth)/register" style={styles.link}>
                Create an account
              </Link>
            </Text>
          </View>
          <Text style={styles.footer}>
            Manuel S. Enverga University Foundation
          </Text>
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
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  brandMark: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.green,
  },
  brandLetter: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
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
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 300,
    marginBottom: 8,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 17,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
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
  footer: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
});
