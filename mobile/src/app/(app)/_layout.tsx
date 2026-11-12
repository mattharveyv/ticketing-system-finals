import { Redirect, Tabs } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme';

type TabIconName = 'tickets' | 'payments' | 'profile';

function TabIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  if (name === 'tickets') {
    return (
      <View style={[styles.iconViewport, styles.documentIcon, { borderColor: color }]}>
        <View style={[styles.documentLine, { backgroundColor: color }]} />
        <View style={[styles.documentLine, { backgroundColor: color }]} />
        <View style={[styles.documentLineShort, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'payments') {
    return (
      <View style={[styles.iconViewport, styles.clockIcon, { borderColor: color }]}>
        <View style={[styles.clockMinuteHand, { backgroundColor: color }]} />
        <View style={[styles.clockHourHand, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.iconViewport, styles.profileIcon]}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileShoulders, { borderColor: color }]} />
    </View>
  );
}

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const { student, loading } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (loading) {
    return null;
  }

  if (!student) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={({ state, descriptors, emitter, navigateToTab }) => {
        const focusedRoute = state.routes[state.index];
        const focusedOptions = descriptors[focusedRoute.key].options;
        const focusedTabBarStyle = StyleSheet.flatten(focusedOptions.tabBarStyle);

        if (keyboardVisible || focusedTabBarStyle?.display === 'none') {
          return null;
        }

        return (
          <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
            <View style={styles.tabBarItems}>
              {state.routes
                .filter((route) => ['tickets', 'payment-queue', 'profile'].includes(route.name))
                .map((route) => {
                  const options = descriptors[route.key].options;
                  const focused = route.key === focusedRoute.key;
                  const title = typeof options.title === 'string' ? options.title : route.name;
                  const color = focused ? colors.greenDark : colors.muted;

                  return (
                    <Pressable
                      key={route.key}
                      accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
                      accessibilityRole="button"
                      accessibilityState={{ selected: focused }}
                      onPress={() => {
                        const event = emitter.emit({
                          type: 'tabPress',
                          target: route.key,
                          canPreventDefault: true,
                        });

                        if (!focused && !event.defaultPrevented) {
                          navigateToTab(route.key);
                        }
                      }}
                      onLongPress={() => {
                        emitter.emit({ type: 'tabLongPress', target: route.key });
                      }}
                      style={styles.tabPressable}
                    >
                      <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
                        {options.tabBarIcon?.({ color, focused, size: 22 })}
                        <Text style={[styles.tabLabel, { color }]}>{title}</Text>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        );
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDark,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarAccessibilityLabel: 'Support tickets',
          tabBarIcon: ({ color }) => <TabIcon color={color} name="tickets" />,
        }}
      />
      <Tabs.Screen
        name="payment-queue"
        options={{
          title: 'Payments',
          tabBarAccessibilityLabel: 'Payment queue',
          tabBarIcon: ({ color }) => <TabIcon color={color} name="payments" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Student profile',
          tabBarIcon: ({ color }) => <TabIcon color={color} name="profile" />,
        }}
      />
      <Tabs.Screen
        name="new-ticket"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="ticket/[ticketNumber]"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ href: null, tabBarItemStyle: { display: 'none' }, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen name="knowledge-base" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen
        name="knowledge-base/[slug]"
        options={{
          href: null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = {
  tabBar: {
    width: '100%' as const,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    paddingTop: 6,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarItems: {
    width: '100%' as const,
    maxWidth: 560,
    height: 62,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabPressable: {
    flex: 1,
    height: 54,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: colors.mint,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  iconViewport: {
    width: 26,
    height: 26,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  documentIcon: {
    width: 17,
    height: 20,
    borderWidth: 2,
    borderRadius: 3,
    gap: 3,
  },
  documentLine: {
    width: 9,
    height: 2,
    borderRadius: 1,
  },
  documentLineShort: {
    width: 6,
    height: 2,
    borderRadius: 1,
    alignSelf: 'flex-start' as const,
    marginLeft: 4,
  },
  clockIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    position: 'relative' as const,
  },
  clockMinuteHand: {
    position: 'absolute' as const,
    width: 2,
    height: 6,
    top: 3,
    left: 7,
    borderRadius: 1,
  },
  clockHourHand: {
    position: 'absolute' as const,
    width: 5,
    height: 2,
    top: 8,
    left: 8,
    borderRadius: 1,
  },
  profileIcon: {
    gap: 2,
  },
  profileHead: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 4,
  },
  profileShoulders: {
    width: 17,
    height: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
};
