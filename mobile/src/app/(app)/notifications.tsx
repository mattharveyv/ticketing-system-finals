import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorMessage, Page, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, StudentNotification } from '../../lib/api';
import { colors } from '../../theme';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadNotifications = useCallback(async (nextPage = 1, append = false) => {
    if (!token || (append && loadingMoreRef.current)) {
      return;
    }

    if (append) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.notifications(token, nextPage);
      setNotifications((current) =>
        append ? [...current, ...response.data] : response.data,
      );
      setUnreadCount(response.meta.unread_count);
      setPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  async function handleMarkAllRead() {
    if (!token || unreadCount === 0) {
      return;
    }

    setWorkingId('all');
    setError('');

    try {
      await api.markAllNotificationsRead(token);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to mark notifications as read.');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleOpenNotification(notification: StudentNotification) {
    if (!token) {
      return;
    }

    setWorkingId(notification.id);
    setError('');

    try {
      if (!notification.read_at) {
        const response = await api.markNotificationRead(token, notification.id);
        setUnreadCount(response.unread_count);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item,
          ),
        );
      }

      const path = notification.url
        ? new URL(notification.url, 'http://mseuf.local').pathname
        : '';
      const ticketMatch = path.match(/^\/user\/tickets\/([^/]+)$/);

      if (path === '/user/payment-queue') {
        router.push('/(app)/payment-queue');
      } else if (ticketMatch?.[1]) {
        router.push({
          pathname: '/(app)/ticket/[ticketNumber]',
          params: { ticketNumber: decodeURIComponent(ticketMatch[1]) },
        });
      } else {
        router.push('/(app)/tickets');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open this notification.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <Page>
      <FlatList
        contentContainerStyle={styles.content}
        data={notifications}
        keyExtractor={(notification) => notification.id}
        onEndReached={() => {
          if (!loading && page < lastPage) {
            void loadNotifications(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadNotifications();
            }}
            tintColor={colors.green}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>YOUR UPDATES</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Ticket replies, status changes, and payment queue calls.
            </Text>
            <View style={styles.toolbar}>
              <Text style={styles.unreadSummary}>
                {unreadCount} unread {unreadCount === 1 ? 'update' : 'updates'}
              </Text>
              {unreadCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={workingId === 'all'}
                  onPress={() => void handleMarkAllRead()}
                  style={styles.readAllButton}
                >
                  <Text style={styles.readAllText}>
                    {workingId === 'all' ? 'Updating…' : 'Mark all read'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {error ? <ErrorMessage message={error} /> : null}
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.green} />
                <Text style={styles.secondaryText}>Loading notifications…</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const unread = !item.read_at;
          const icon = item.category.toLowerCase().includes('payment')
            ? '$'
            : item.category.toLowerCase().includes('reply')
              ? '↩'
              : '◈';

          return (
            <Pressable
              accessibilityRole="button"
              disabled={workingId === item.id}
              onPress={() => void handleOpenNotification(item)}
              style={({ pressed }) => [
                styles.notificationCard,
                unread && styles.unreadCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.icon, unread && styles.unreadIcon]}>
                <Text style={[styles.iconText, unread && styles.unreadIconText]}>{icon}</Text>
              </View>
              <View style={styles.notificationBody}>
                <View style={styles.notificationHeading}>
                  <Text numberOfLines={2} style={styles.notificationTitle}>{item.title}</Text>
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationMeta}>
                  {item.category}
                  {item.created_at
                    ? ` · ${new Date(item.created_at).toLocaleString()}`
                    : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>You’re all caught up</Text>
              <Text style={styles.secondaryText}>
                New ticket updates and payment queue calls will appear here.
              </Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.green} style={styles.footerLoader} />
          ) : !loading && page < lastPage ? (
            <PrimaryButton
              title="Load more"
              onPress={() => void loadNotifications(page + 1, true)}
            />
          ) : undefined
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  header: {
    gap: 9,
    paddingBottom: 5,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  unreadSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  readAllButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.mint,
    paddingHorizontal: 12,
  },
  readAllText: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '800',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 16,
  },
  secondaryText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },
  unreadCard: {
    borderColor: colors.burgundyTint,
    backgroundColor: colors.soft,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.paper,
  },
  unreadIcon: {
    backgroundColor: colors.mint,
  },
  iconText: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '800',
  },
  unreadIconText: {
    color: colors.green,
  },
  notificationBody: {
    flex: 1,
    gap: 5,
  },
  notificationHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  notificationMessage: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  notificationMeta: {
    color: colors.muted,
    fontSize: 10,
  },
  emptyCard: {
    gap: 7,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 18,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  footerLoader: {
    paddingVertical: 14,
  },
});
