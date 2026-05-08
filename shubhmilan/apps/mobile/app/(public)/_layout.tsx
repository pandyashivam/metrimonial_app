import { Slot } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { MarketingFooter } from '../../src/MarketingFooter';
import { MarketingHeader } from '../../src/MarketingHeader';

/**
 * Layout for the (public) route group — the marketing surface served by the
 * web build only. Sticky header at top, scrollable content, footer at the
 * bottom of every page. The native build never enters this group; the root
 * layout redirects native users straight into (auth) on cold start.
 */
export default function PublicLayout() {
  if (Platform.OS !== 'web') {
    // Defensive: mobile native should never mount this group, but if a deep
    // link routes here, we render the slot without the marketing chrome so
    // we don't end up with a desktop-shaped header on a phone.
    return <Slot />;
  }
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <MarketingHeader />
      <View style={styles.content}>
        <Slot />
      </View>
      <MarketingFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FBF7F2' },
  container: { minHeight: '100%' as unknown as number },
  content: { flex: 1 },
});
