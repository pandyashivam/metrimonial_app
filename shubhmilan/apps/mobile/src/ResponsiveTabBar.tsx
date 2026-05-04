import { FontAwesome6 } from '@expo/vector-icons';
import { colors, fontSizes, spacing } from '@shubhmilan/ui';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/**
 * Renders the tab bar as a horizontal bottom strip on narrow viewports and as a
 * vertical side rail on viewports ≥ 768px. Triggered on web by the desktop
 * breakpoint; on tablets it kicks in too, and on phones (mobile native) the
 * narrow path is always used because viewport width is < 768.
 *
 * Wired into Expo Router via `tabBar={(props) => <ResponsiveTabBar {...props} />}`
 * in `app/(tabs)/_layout.tsx`.
 */

const ICON: Record<string, string> = {
  home: 'house',
  search: 'magnifying-glass',
  matches: 'heart',
  messages: 'message',
  me: 'user',
};

const LABEL: Record<string, string> = {
  home: 'Home',
  search: 'Search',
  matches: 'Matches',
  messages: 'Messages',
  me: 'Me',
};

export function ResponsiveTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 768;

  const items = state.routes.map((route, index) => {
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };
    return {
      key: route.key,
      name: route.name,
      focused,
      onPress,
    };
  });

  if (wide) {
    return (
      <View style={styles.rail}>
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text style={styles.brandWord}>ShubhMilan</Text>
        </View>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: item.focused }}
            style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [
              styles.railItem,
              item.focused && styles.railItemActive,
              hovered && !item.focused ? styles.railItemHover : null,
              pressed && { opacity: 0.85 },
            ]}
          >
            <FontAwesome6
              name={ICON[item.name] ?? 'circle'}
              size={18}
              color={item.focused ? colors.primary : colors.textMuted}
            />
            <Text
              style={[styles.railLabel, item.focused && styles.railLabelActive]}
              numberOfLines={1}
            >
              {LABEL[item.name] ?? item.name}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: item.focused }}
          style={({ pressed }) => [styles.barItem, pressed && { opacity: 0.7 }]}
        >
          <FontAwesome6
            name={ICON[item.name] ?? 'circle'}
            size={20}
            color={item.focused ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.barLabel, item.focused && styles.barLabelActive]}>
            {LABEL[item.name] ?? item.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const RAIL_WIDTH = 248;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 6,
    paddingTop: 6,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  barLabel: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    fontWeight: '500',
  },
  barLabelActive: { color: colors.primary, fontWeight: '700' },

  rail: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  brandDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.primary },
  brandWord: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
  },
  railItemActive: { backgroundColor: colors.primary50 },
  railItemHover: { backgroundColor: colors.surfaceAlt },
  railLabel: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    fontWeight: '500',
  },
  railLabelActive: { color: colors.primary, fontWeight: '700' },
});

/**
 * Left padding to apply to screen content when the side rail is shown.
 * Use in screens that render full-bleed: `paddingLeft: useTabBarSidePadding()`.
 */
export function useTabBarSidePadding() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768 ? RAIL_WIDTH : 0;
}
