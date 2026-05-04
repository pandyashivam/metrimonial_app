import { colors } from '@shubhmilan/ui';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions, View } from 'react-native';

import { ResponsiveTabBar } from '../../src/ResponsiveTabBar';

const SIDE_RAIL_WIDTH = 248;

/**
 * Tab navigator. The bar itself is custom (`ResponsiveTabBar`) so it can render
 * as a bottom strip on phones / narrow web and a side rail on desktop ≥ 768px.
 *
 * On wide web we shift the screen container right by the rail width so screens
 * don't render under the rail; on narrow we let `Tabs` lay out normally.
 */
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 768;

  return (
    <View style={{ flex: 1, paddingLeft: wide ? SIDE_RAIL_WIDTH : 0 }}>
      <Tabs
        tabBar={(props) => <ResponsiveTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerShown: false,
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
        <Tabs.Screen name="me" options={{ title: 'Me' }} />
      </Tabs>
    </View>
  );
}
