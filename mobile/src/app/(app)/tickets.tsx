import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorMessage, Field, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, Ticket } from '../../lib/api';
import { colors } from '../../theme';

const ticketStatuses = [
  'All',
  'New',
  'In Progress',
  'Waiting for Student',
  'Resolved',
  'Completed',
  'Closed',
] as const;

function statusColors(status: string) {
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

function TicketCard({ ticket }: { ticket: Ticket }) {
  const badge = statusColors(ticket.status);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/(app)/ticket/[ticketNumber]',
          params: { ticketNumber: ticket.ticket_number },
        })
      }
      style={({ pressed }) => [styles.ticketCard, pressed && styles.pressed]}
    >
      <View style={styles.ticketTop}>
        <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: badge.background }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{ticket.status}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.ticketTitle}>
        {ticket.subject}
      </Text>
      <View style={styles.ticketMeta}>
        <Text style={styles.metaText}>{ticket.support_type}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{ticket.category}</Text>
      </View>
    </Pressable>
  );
}

export default function TicketsScreen() {
  const { student, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ active: 0, resolved: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof ticketStatuses)[number]>('All');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasLoadedTicketsRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    const currentRequestVersion = requestVersion.current + 1;
    requestVersion.current = currentRequestVersion;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setError('');

    if (isRefresh) {
      setRefreshing(true);
    } else if (!hasLoadedTicketsRef.current) {
      setLoading(true);
    }

    try {
      const response = await api.tickets(token, {
        page: 1,
        search,
        status: status === 'All' ? null : status,
      });

      if (currentRequestVersion !== requestVersion.current) {
        return;
      }

      setTickets(response.data);
      setStats(response.stats);
      setPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
      setTotalTickets(response.meta.total);
      hasLoadedTicketsRef.current = true;
    } catch (cause) {
      if (currentRequestVersion === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : 'Unable to load tickets.');
      }
    } finally {
      if (currentRequestVersion === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [search, status, token]);

  const loadMoreTickets = useCallback(async () => {
    if (!token || loadingMoreRef.current || loading || page >= lastPage) {
      return;
    }

    const currentRequestVersion = requestVersion.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await api.tickets(token, {
        page: page + 1,
        search,
        status: status === 'All' ? null : status,
      });

      if (currentRequestVersion === requestVersion.current) {
        setTickets((current) => [...current, ...response.data]);
        setPage(response.meta.current_page);
        setLastPage(response.meta.last_page);
      }
    } catch (cause) {
      if (currentRequestVersion === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : 'Unable to load more tickets.');
      }
    } finally {
      if (currentRequestVersion === requestVersion.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [lastPage, loading, page, search, status, token]);

  useFocusEffect(
    useCallback(() => {
      void loadTickets();
    }, [loadTickets]),
  );

  return (
    <Page>
      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        data={tickets}
        keyExtractor={(ticket) => ticket.ticket_number}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadTickets(true);
            }}
            tintColor={colors.green}
          />
        }
        onEndReached={() => {
          void loadMoreTickets();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>M</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                  hitSlop={5}
                  onPress={() => router.push('/(app)/notifications')}
                  style={({ pressed }) => [
                    styles.notificationsLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.notificationsIcon}>◈</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={5}
                  onPress={() => router.push('/(app)/profile')}
                  style={({ pressed }) => [
                    styles.profileLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.profileLinkText}>My profile →</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.eyebrow}>MANUEL S. ENVERGA UNIVERSITY FOUNDATION</Text>
            <Text style={styles.greeting}>Hi, {student?.name.split(' ')[0]}.</Text>
            <Text style={styles.subtitle}>Your support requests, all in one place.</Text>
            <View style={styles.statsRow}>
              <View style={[styles.summaryCard, styles.activeCard]}>
                <Text style={styles.summaryLabel}>ACTIVE REQUESTS</Text>
                <Text style={styles.summaryCount}>{stats.active}</Text>
                <Text style={styles.summaryHint}>Awaiting or being handled</Text>
              </View>
              <View style={[styles.summaryCard, styles.resolvedCard]}>
                <Text style={[styles.summaryLabel, styles.resolvedCardLabel]}>RESOLVED</Text>
                <Text style={[styles.summaryCount, styles.resolvedCardCount]}>{stats.resolved}</Text>
                <Text style={[styles.summaryHint, styles.resolvedCardHint]}>Completed by staff</Text>
              </View>
            </View>
            <View style={styles.filters}>
              <Field
                accessibilityLabel="Search tickets by subject or ticket number"
                autoCapitalize="none"
                label="Search tickets"
                onChangeText={setSearchInput}
                placeholder="Ticket number or subject"
                returnKeyType="search"
                value={searchInput}
              />
              <Text style={styles.filterLabel}>Filter by status</Text>
              <View style={styles.statusFilters}>
                {ticketStatuses.map((item) => {
                  const selected = status === item;

                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setStatus(item)}
                      style={[styles.statusFilter, selected && styles.statusFilterSelected]}
                    >
                      <Text
                        style={[
                          styles.statusFilterText,
                          selected && styles.statusFilterTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>My tickets</Text>
                <Text style={styles.sectionSubtitle}>Follow each request’s progress</Text>
              </View>
              <Pressable
                accessibilityLabel="Create a new support ticket"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => router.push('/new-ticket')}
                style={({ pressed }) => [styles.newLink, pressed && styles.pressed]}
              >
                <Text style={styles.newLinkText}>+ New</Text>
              </Pressable>
            </View>
            {error ? (
              <View style={styles.errorWrap}>
                <ErrorMessage message={error} />
                <PrimaryButton title="Retry" onPress={() => void loadTickets()} />
              </View>
            ) : null}
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.green} />
                <Text style={styles.metaText}>Loading your tickets…</Text>
              </View>
            ) : null}
            {!loading && !error ? (
              <Text style={styles.resultCount}>
                {tickets.length === 0
                  ? 'No tickets found'
                  : `Showing ${tickets.length} of ${totalTickets} ticket${totalTickets === 1 ? '' : 's'}`}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <TicketCard ticket={item} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>{search || status !== 'All' ? '⌕' : '✳'}</Text>
              <Text style={styles.emptyTitle}>
                {search || status !== 'All' ? 'No matching tickets' : 'No tickets yet'}
              </Text>
              <Text style={styles.emptyText}>
                {search || status !== 'All'
                  ? 'Try a different search or status filter.'
                  : 'Send your first request to the right MSEUF support office.'}
              </Text>
              {search || status !== 'All' ? (
                <PrimaryButton
                  title="Clear search and filters"
                  onPress={() => {
                    setSearchInput('');
                    setSearch('');
                    setStatus('All');
                  }}
                />
              ) : (
                <PrimaryButton
                  title="Create a support ticket"
                  onPress={() => router.push('/new-ticket')}
                />
              )}
            </View>
          ) : undefined
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.green} style={styles.footerLoader} />
          ) : !loading && page < lastPage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadMoreTickets()}
              style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
            >
              <Text style={styles.loadMoreText}>Load more tickets</Text>
            </Pressable>
          ) : undefined
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 10,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationsLink: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  notificationsIcon: {
    color: colors.greenDark,
    fontSize: 20,
    fontWeight: '800',
  },
  profileLink: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.mint,
    paddingHorizontal: 12,
  },
  profileLinkText: {
    color: colors.greenDark,
    fontSize: 13,
    fontWeight: '800',
  },
  brandMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.green,
  },
  brandLetter: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '900',
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  greeting: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  summaryCard: {
    flex: 1,
    gap: 5,
    borderRadius: 16,
    padding: 15,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  activeCard: {
    backgroundColor: colors.nav,
  },
  resolvedCard: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  summaryLabel: {
    color: colors.burgundyText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryCount: {
    color: colors.white,
    fontSize: 29,
    fontWeight: '900',
  },
  summaryHint: {
    color: colors.burgundyText,
    fontSize: 10,
  },
  resolvedCardLabel: {
    color: colors.muted,
  },
  resolvedCardCount: {
    color: colors.ink,
  },
  resolvedCardHint: {
    color: colors.muted,
  },
  filters: {
    gap: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    backgroundColor: colors.white,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  filterLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  statusFilter: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 11,
  },
  statusFilterSelected: {
    borderColor: colors.green,
    backgroundColor: colors.mint,
  },
  statusFilterText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusFilterTextSelected: {
    color: colors.greenDark,
  },
  resultCount: {
    color: colors.muted,
    fontSize: 11,
  },
  loadMoreButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  loadMoreText: {
    color: colors.greenDark,
    fontSize: 13,
    fontWeight: '800',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
  },
  newLink: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.burgundyTint,
    paddingHorizontal: 14,
  },
  newLinkText: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: '800',
  },
  ticketCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    backgroundColor: colors.white,
    padding: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ticketNumber: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 7,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  metaDot: {
    color: colors.line,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 18,
  },
  errorWrap: {
    gap: 9,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 22,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  emptyIcon: {
    color: colors.green,
    fontSize: 27,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
