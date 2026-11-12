import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { api, Ticket } from '../../../lib/api';
import { colors } from '../../../theme';

function statusStyle(status: string) {
  if (['Resolved', 'Completed', 'Closed'].includes(status)) {
    return {
      background: status === 'Closed' ? colors.neutralBg : colors.successSoft,
      text: status === 'Closed' ? colors.neutral : colors.success,
    };
  }

  if (status === 'Waiting for Student') {
    return { background: colors.purpleBg, text: colors.purple };
  }

  if (status === 'In Progress') {
    return { background: colors.amberBg, text: colors.amber };
  }

  return { background: colors.blueBg, text: colors.blue };
}

export default function TicketDetailsScreen() {
  const { ticketNumber } = useLocalSearchParams<{ ticketNumber: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      if (!token || !ticketNumber) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        setTicket(await api.ticket(token, ticketNumber));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load this ticket.');
      } finally {
        setLoading(false);
      }
    }

    void loadTicket();
  }, [ticketNumber, token]);

  async function handleReply() {
    if (!token || !ticketNumber || !reply.trim()) {
      return;
    }

    setSubmittingReply(true);
    setReplyError('');

    try {
      setTicket(await api.replyToTicket(token, ticketNumber, reply.trim()));
      setReply('');
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : 'Unable to send your reply.');
    } finally {
      setSubmittingReply(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  const badge = ticket ? statusStyle(ticket.status) : null;

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
        {error ? <ErrorMessage message={error} /> : null}
        {ticket && badge ? (
          <>
            <Text style={styles.eyebrow}>{ticket.ticket_number}</Text>
            <Text style={styles.title}>{ticket.subject}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.background }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>
                {ticket.status}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>SUPPORT OFFICE</Text>
              <Text style={styles.value}>{ticket.support_type}</Text>
              <View style={styles.divider} />
              <Text style={styles.label}>ISSUE TYPE</Text>
              <Text style={styles.value}>{ticket.category}</Text>
              <View style={styles.divider} />
              <Text style={styles.label}>DESCRIPTION</Text>
              <Text style={styles.description}>{ticket.description}</Text>
              {ticket.location ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.label}>LOCATION</Text>
                  <Text style={styles.value}>{ticket.location}</Text>
                </>
              ) : null}
            </View>
            <Text style={styles.sectionTitle}>Ticket updates</Text>
            {ticket.updates?.length ? (
              <View style={styles.card}>
                {ticket.updates.map((update, index) => (
                  <View key={`${update.created_at}-${index}`} style={styles.update}>
                    <View style={styles.updateDot} />
                    <View style={styles.updateBody}>
                      <Text style={styles.updateAuthor}>{update.author}</Text>
                      <Text style={styles.updateText}>{update.body}</Text>
                      <Text style={styles.updateDate}>
                        {update.created_at
                          ? new Date(update.created_at).toLocaleString()
                          : 'Recently'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noUpdates}>There are no updates yet.</Text>
            )}
          </>
        ) : null}
        {ticket ? (
          <View style={styles.replyCard}>
            <Text style={styles.sectionTitle}>Reply to this ticket</Text>
            <Text style={styles.noUpdates}>
              Add any details that may help the support office with your request.
            </Text>
            <Field
              label="Your message"
              maxLength={5000}
              multiline
              onChangeText={setReply}
              placeholder="Write a message for the support office"
              value={reply}
            />
            {replyError ? <ErrorMessage message={replyError} /> : null}
            <PrimaryButton
              title="Send reply"
              onPress={() => void handleReply()}
              loading={submittingReply}
              disabled={!reply.trim()}
            />
          </View>
        ) : null}
        {error ? (
          <PrimaryButton title="Back to tickets" onPress={() => router.replace('/(app)/tickets')} />
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 14,
    padding: 20,
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
    marginTop: 10,
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 17,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  replyCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 17,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  value: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    marginVertical: 5,
    backgroundColor: colors.line,
  },
  sectionTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  update: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 7,
  },
  updateDot: {
    width: 9,
    height: 9,
    marginTop: 5,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  updateBody: {
    flex: 1,
    gap: 4,
  },
  updateAuthor: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  updateText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  updateDate: {
    color: colors.muted,
    fontSize: 11,
  },
  noUpdates: {
    color: colors.muted,
    fontSize: 13,
  },
});
