import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, PaymentQueueEntry, PaymentQueueStatus } from '../../lib/api';
import { colors } from '../../theme';

const paymentTypes = ['Tuition', 'Balance', 'Other'] as const;
const queueTypes = ['Regular', 'Priority'] as const;

function QueueEntryCard({ entry }: { entry: PaymentQueueEntry }) {
  const badgeStyle =
    entry.status === 'Waiting'
      ? styles.waitingBadge
      : entry.status === 'Called' || entry.status === 'Serving'
        ? styles.calledBadge
        : entry.status === 'Skipped'
          ? styles.skippedBadge
          : styles.completeBadge;
  const badgeTextStyle =
    entry.status === 'Waiting'
      ? styles.waitingText
      : entry.status === 'Called' || entry.status === 'Serving'
        ? styles.calledText
        : entry.status === 'Skipped'
          ? styles.skippedText
          : styles.completeText;
  const positionText =
    entry.status === 'Waiting' && entry.position
      ? `Position #${entry.position} in line`
      : entry.status === 'Waiting'
        ? 'Waiting for position'
        : entry.status === 'Called' || entry.status === 'Serving'
          ? 'Please proceed to the payment counter'
          : entry.status;

  return (
    <View style={[styles.entryCard, entry.status === 'Called' && styles.calledCard]}>
      <View style={styles.entryHeader}>
        <View>
          <Text style={styles.entryLabel}>QUEUE NUMBER</Text>
          <Text style={styles.entryNumber}>{entry.queueNumber}</Text>
        </View>
        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusText, badgeTextStyle]}>{entry.status}</Text>
        </View>
      </View>
      <Text style={styles.entryService}>
        {entry.paymentType}
        {entry.otherDetails ? ` · ${entry.otherDetails}` : ''}
      </Text>
      <View style={styles.entryFooter}>
        <Text style={styles.positionText}>{positionText}</Text>
        <Text style={styles.priorityText}>{entry.queueType}</Text>
      </View>
      {entry.calledAt ? <Text style={styles.calledAt}>Called at {entry.calledAt}</Text> : null}
    </View>
  );
}

export default function PaymentQueueScreen() {
  const { token } = useAuth();
  const [queue, setQueue] = useState<PaymentQueueStatus | null>(null);
  const [paymentType, setPaymentType] = useState<(typeof paymentTypes)[number] | ''>('');
  const [queueType, setQueueType] = useState<(typeof queueTypes)[number]>('Regular');
  const [otherDetails, setOtherDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queueRequestInFlightRef = useRef(false);

  const loadQueue = useCallback(async () => {
    if (!token || queueRequestInFlightRef.current) {
      return;
    }

    queueRequestInFlightRef.current = true;

    try {
      setQueue(await api.paymentQueueStatus(token));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load payment queue.');
    } finally {
      queueRequestInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadQueue();
      const interval = setInterval(() => {
        void loadQueue();
      }, 30000);

      return () => clearInterval(interval);
    }, [loadQueue]),
  );

  async function handleJoinQueue() {
    if (!token || !paymentType) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const entry = await api.joinPaymentQueue(token, {
        payment_type: paymentType,
        queue_type: queueType,
        ...(paymentType === 'Other' ? { other_details: otherDetails.trim() } : {}),
      });
      setSuccess(`You joined the line. Your number is ${entry.queueNumber}.`);
      setPaymentType('');
      setQueueType('Regular');
      setOtherDetails('');
      await loadQueue();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to join the payment line.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeEntries = queue?.entries.filter((entry) =>
    ['Waiting', 'Called', 'Serving'].includes(entry.status),
  ) ?? [];
  const recentEntries = queue?.entries.filter((entry) =>
    ['Served', 'Skipped'].includes(entry.status),
  ) ?? [];
  const calledEntry = activeEntries.find((entry) =>
    ['Called', 'Serving'].includes(entry.status),
  );

  return (
    <Page>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadQueue();
            }}
            tintColor={colors.green}
          />
        }
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>MSEUF STUDENT SERVICES</Text>
          <Text style={styles.title}>Payment line</Text>
          <Text style={styles.subtitle}>
            Join or check the walk-in line for tuition, balance, and other payment services.
          </Text>
        </View>

        <View style={styles.liveCard}>
          <View style={styles.liveTop}>
            <Text style={styles.liveLabel}>NOW CALLING</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.liveNumber}>
            {queue?.currentCall?.queueNumber ?? 'No number yet'}
          </Text>
          <Text style={styles.liveDetails}>
            {queue?.currentCall
              ? `${queue.currentCall.paymentType} · ${queue.currentCall.queueType}`
              : 'The number being called will appear here.'}
          </Text>
          <View style={styles.waitingCount}>
            <Text style={styles.waitingNumber}>{queue?.waitingCount ?? 0}</Text>
            <Text style={styles.waitingCopy}>students waiting</Text>
          </View>
        </View>

        {calledEntry ? (
          <View style={styles.callAlert}>
            <Text style={styles.callAlertTitle}>Your number has been called</Text>
            <Text style={styles.callAlertBody}>
              Please proceed to the payment counter for {calledEntry.queueNumber}.
            </Text>
          </View>
        ) : null}

        {error ? <ErrorMessage message={error} /> : null}
        {success ? (
          <View accessibilityRole="alert" style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join the payment line</Text>
          <Text style={styles.cardSubtitle}>
            For in-person payment assistance. Other concerns should be sent as support tickets.
          </Text>
          <Text style={styles.fieldLabel}>Payment service</Text>
          <View style={styles.choices}>
            {paymentTypes.map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected: type === paymentType }}
                onPress={() => setPaymentType(type)}
                style={[styles.choice, paymentType === type && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, paymentType === type && styles.choiceTextSelected]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Queue type</Text>
          <View style={styles.choices}>
            {queueTypes.map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected: type === queueType }}
                onPress={() => setQueueType(type)}
                style={[styles.choice, queueType === type && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, queueType === type && styles.choiceTextSelected]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          {queueType === 'Priority' ? (
            <Text style={styles.helper}>
              Priority numbers are called two times for every regular number when both lines are waiting.
            </Text>
          ) : null}
          {paymentType === 'Other' ? (
            <Field
              label="Describe the payment service"
              maxLength={150}
              onChangeText={setOtherDetails}
              placeholder="For example, transcript fee"
              value={otherDetails}
            />
          ) : null}
          <PrimaryButton
            title="Join payment line"
            onPress={() => void handleJoinQueue()}
            loading={submitting}
            disabled={!paymentType || (paymentType === 'Other' && !otherDetails.trim())}
          />
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>My queue numbers</Text>
            <Text style={styles.sectionSubtitle}>Your position updates automatically.</Text>
          </View>
        </View>
        {loading ? (
          <Text style={styles.helper}>Loading your queue…</Text>
        ) : activeEntries.length ? (
          activeEntries.map((entry) => <QueueEntryCard key={entry.id} entry={entry} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active queue numbers</Text>
            <Text style={styles.emptyText}>Choose a payment service above to join the line.</Text>
          </View>
        )}
        {recentEntries.length ? (
          <>
            <Text style={styles.historyTitle}>Recent activity</Text>
            {recentEntries.map((entry) => <QueueEntryCard key={entry.id} entry={entry} />)}
          </>
        ) : null}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },
  heading: {
    gap: 6,
  },
  eyebrow: {
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
  liveCard: {
    gap: 7,
    borderRadius: 20,
    backgroundColor: colors.nav,
    padding: 18,
    shadowColor: colors.nav,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  liveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveLabel: {
    color: colors.burgundyText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7ac79b',
  },
  liveIndicatorText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveNumber: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  liveDetails: {
    color: colors.burgundyText,
    fontSize: 12,
  },
  waitingCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#ffffff24',
    paddingTop: 10,
  },
  waitingNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  waitingCopy: {
    color: colors.burgundyText,
    fontSize: 12,
  },
  callAlert: {
    gap: 4,
    borderWidth: 1,
    borderColor: '#c88a37',
    borderRadius: 14,
    backgroundColor: colors.amberBg,
    padding: 13,
  },
  callAlertTitle: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '800',
  },
  callAlertBody: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  successBox: {
    borderRadius: 12,
    backgroundColor: colors.successSoft,
    padding: 12,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    gap: 13,
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
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
  },
  choiceSelected: {
    borderColor: colors.green,
    backgroundColor: colors.mint,
  },
  choiceText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.greenDark,
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
  },
  entryCard: {
    gap: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 15,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },
  calledCard: {
    borderColor: colors.green,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  entryNumber: {
    marginTop: 3,
    color: colors.green,
    fontSize: 20,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  waitingBadge: {
    backgroundColor: colors.blueBg,
  },
  calledBadge: {
    backgroundColor: colors.amberBg,
  },
  completeBadge: {
    backgroundColor: colors.successSoft,
  },
  skippedBadge: {
    backgroundColor: colors.neutralBg,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  waitingText: {
    color: colors.blue,
  },
  calledText: {
    color: colors.amber,
  },
  completeText: {
    color: colors.success,
  },
  skippedText: {
    color: colors.neutral,
  },
  entryService: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  positionText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
  },
  priorityText: {
    color: colors.greenDark,
    fontSize: 11,
    fontWeight: '800',
  },
  calledAt: {
    color: colors.muted,
    fontSize: 11,
  },
  emptyCard: {
    gap: 5,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  historyTitle: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
});
