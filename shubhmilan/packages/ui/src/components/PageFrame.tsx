import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../tokens.js';

export interface PageFrameProps {
  children: React.ReactNode;
  /** Constrain content to this width on viewports wider than itself. Default 540. */
  maxWidth?: number;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Padding scale around the inner column. Default 'lg' (24px). */
  padding?: keyof typeof PAD;
  /** Center the inner column vertically (good for short auth screens). Default false. */
  centerVertical?: boolean;
  background?: 'page' | 'surface';
  /** Override SafeAreaView edges. */
  edges?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>;
  style?: ViewStyle;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children'>;
}

const PAD = { sm: spacing.md, md: spacing.lg, lg: spacing.xl, xl: spacing.xxl } as const;

/**
 * PageFrame — outer chrome for any full-screen route.
 *
 *   • SafeAreaView with the page background (cream) so notches and rails are handled.
 *   • Centers content in a max-width column on wide viewports so 1440px desktop
 *     doesn't render an edge-to-edge phone layout.
 *   • Optional ScrollView with `keyboardShouldPersistTaps='handled'` so taps on
 *     buttons don't get eaten by the keyboard dismiss gesture.
 *
 * Use it on every route. Pages that need an internal full-bleed FlatList can
 * pass `scroll={false}` and lay out their own list.
 */
export function PageFrame({
  children,
  maxWidth = 540,
  scroll = true,
  padding = 'lg',
  centerVertical = false,
  background = 'page',
  edges,
  style,
  scrollProps,
}: PageFrameProps) {
  const bg = background === 'page' ? colors.bg : colors.surface;
  const padPx = PAD[padding];
  const inner = (
    <View
      style={[
        styles.column,
        { maxWidth, paddingHorizontal: padPx, paddingVertical: padPx },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            centerVertical && Platform.OS !== 'web' ? { flexGrow: 1, justifyContent: 'center' } : null,
            centerVertical && Platform.OS === 'web' ? { minHeight: '100%', justifyContent: 'center' as const } : null,
          ]}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignItems: 'center' },
  scroll: { flexGrow: 1, alignItems: 'center' },
  column: {
    width: '100%',
  },
});
