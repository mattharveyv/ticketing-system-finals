import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';

export default function IndexScreen() {
  const { student, loading, startupError, retrySession } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.loadingText}>Opening your help desk…</Text>
      </View>
    );
  }

  if (startupError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Can’t connect yet</Text>
        <Text style={styles.message}>{startupError}</Text>
        <PrimaryButton title="Try again" onPress={() => void retrySession()} />
      </View>
    );
  }

  return student ? (
    <Redirect href="/(app)/tickets" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    padding: 28,
  },
  loadingText: {
    color: colors.muted,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
