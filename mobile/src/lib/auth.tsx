import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { api, ApiError, Student } from './api';

type AuthContextValue = {
  student: Student | null;
  token: string | null;
  loading: boolean;
  startupError: string | null;
  updateStudent: (student: Student) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: Parameters<typeof api.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  retrySession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'mseuf-helpdesk-token';

async function getSavedToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('Browser storage is not available.');
    }

    window.localStorage.setItem(TOKEN_KEY, token);

    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function deleteSavedToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    try {
      const savedToken = await getSavedToken();

      if (!savedToken) {
        setStudent(null);
        setToken(null);
        setStartupError(null);
        return;
      }

      const savedStudent = await api.currentStudent(savedToken);
      setStudent(savedStudent);
      setToken(savedToken);
      setStartupError(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await deleteSavedToken();
        setStudent(null);
        setToken(null);
      } else {
        setStartupError(
          error instanceof Error ? error.message : 'Unable to restore your session.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // State updates happen after secure storage and the API request complete.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restoreSession();
  }, [restoreSession]);

  const saveAuth = async (auth: { token: string; user: Student }) => {
    await saveToken(auth.token);
    setStudent(auth.user);
    setToken(auth.token);
    setStartupError(null);
  };

  const login = async (email: string, password: string) => {
    await saveAuth(await api.login(email.trim(), password));
  };

  const register = async (input: Parameters<typeof api.register>[0]) => {
    await saveAuth(await api.register(input));
  };

  const logout = async () => {
    const currentToken = token;

    try {
      if (currentToken) {
        await api.logout(currentToken);
      }
    } finally {
      await deleteSavedToken();
      setStudent(null);
      setToken(null);
    }
  };

  const retrySession = useCallback(async () => {
    setLoading(true);
    setStartupError(null);
    await restoreSession();
  }, [restoreSession]);

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        loading,
        startupError,
        updateStudent: setStudent,
        login,
        register,
        logout,
        retrySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
