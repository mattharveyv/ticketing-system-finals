import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function AuthLayout() {
  const { student, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (student) {
    return <Redirect href="/(app)/tickets" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
