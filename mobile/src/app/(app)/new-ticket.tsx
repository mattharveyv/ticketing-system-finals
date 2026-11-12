import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, SupportType } from '../../lib/api';
import { colors } from '../../theme';

const categories = [
  'Account access',
  'Classroom technology',
  'Network and Wi-Fi',
  'Facilities',
  'Registration',
  'Payments and finance',
  'Library services',
  'Student services',
  'Other',
];

export default function NewTicketScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [supportTypes, setSupportTypes] = useState<SupportType[]>([]);
  const [supportTypeId, setSupportTypeId] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadSupportTypes = useCallback(async () => {
    if (!token) {
      setLoadingTypes(false);
      return;
    }

    try {
      const types = await api.supportTypes(token);
      setSupportTypes(types);
      setSupportTypeId(types[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load support offices.');
    } finally {
      setLoadingTypes(false);
    }
  }, [token]);

  useEffect(() => {
    // Support office state updates happen after the asynchronous request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSupportTypes();
  }, [loadSupportTypes]);

  async function handleSubmit() {
    setError('');

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    if (!supportTypeId) {
      setError('Choose an available support office before submitting.');
      return;
    }

    if (!subject.trim() || !category || !description.trim()) {
      setError('Please add a subject, choose an issue type, and describe your concern.');
      return;
    }

    setSubmitting(true);

    try {
      const ticket = await api.createTicket(token, {
        subject: subject.trim(),
        category,
        support_type_id: supportTypeId,
        location: location.trim(),
        description: description.trim(),
      });
      router.replace({
        pathname: '/(app)/ticket/[ticketNumber]',
        params: { ticketNumber: ticket.ticket_number },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your ticket.');
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityLabel="Back to my tickets"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.back}>‹  My tickets</Text>
          </Pressable>
          <Text style={styles.eyebrow}>SEND A REQUEST</Text>
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>
            Your request will go to the MSEUF support office you choose.
          </Text>

          <View style={styles.formCard}>
            <Field
              label="What do you need help with?"
              onChangeText={setSubject}
              placeholder="A short summary"
              value={subject}
            />
            <View style={styles.field}>
              <Text style={styles.label}>Support office</Text>
              {loadingTypes ? (
                <Text style={styles.helper}>Loading support offices…</Text>
              ) : supportTypes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.helper}>
                    No support offices are available. Try again or contact the school support team.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setLoadingTypes(true);
                      setError('');
                      void loadSupportTypes();
                    }}
                  >
                    <Text style={styles.retry}>Retry loading offices</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.choiceList}>
                  {supportTypes.map((supportType) => (
                    <Pressable
                      key={supportType.id}
                      onPress={() => setSupportTypeId(supportType.id)}
                      style={[
                        styles.choice,
                        supportType.id === supportTypeId && styles.choiceSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          supportType.id === supportTypeId && styles.choiceTextSelected,
                        ]}
                      >
                        {supportType.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Issue type</Text>
              <View style={styles.choiceList}>
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.choice, item === category && styles.choiceSelected]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        item === category && styles.choiceTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Field
              label="Campus location (optional)"
              onChangeText={setLocation}
              placeholder="Building, room, or area"
              value={location}
            />
            <Field
              label="Tell us more"
              multiline
              onChangeText={setDescription}
              placeholder="Describe what happened and what you need."
              value={description}
            />
            <Text style={styles.helper}>
              Subject, issue type, and details are required to submit.
            </Text>
            {error ? <ErrorMessage message={error} /> : null}
            <PrimaryButton
              title="Submit support request"
              onPress={() => void handleSubmit()}
              loading={submitting}
              disabled={loadingTypes || supportTypes.length === 0}
            />
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
    maxWidth: 760,
    alignSelf: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 36,
  },
  back: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 14,
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    gap: 17,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 17,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 12,
  },
  emptyState: {
    gap: 8,
  },
  retry: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
  },
  choiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceSelected: {
    borderColor: colors.green,
    backgroundColor: colors.mint,
  },
  choiceText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  choiceTextSelected: {
    color: colors.greenDark,
    fontWeight: '800',
  },
});
