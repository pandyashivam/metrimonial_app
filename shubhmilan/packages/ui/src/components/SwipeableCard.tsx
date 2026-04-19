import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ProfileSummary } from '@shubhmilan/types';
import { colors, fontSizes, radii, shadows } from '../tokens.js';
import { VerificationBadge } from './VerificationBadge.js';

export interface SwipeableCardProps {
  profile: ProfileSummary;
  /** Fired when the card is dragged past the swipe threshold to the right. */
  onSwipeRight?: (id: string) => void;
  /** Fired when the card is dragged past the swipe threshold to the left. */
  onSwipeLeft?: (id: string) => void;
  /** Fired on a neutral tap (not a swipe). */
  onPress?: (id: string) => void;
  /** Height override — by default the card fills its parent. */
  height?: number;
}

const SWIPE_THRESHOLD = 120;
const ROTATION_FACTOR = 10;

/**
 * Tinder-style profile card with pan-to-swipe. Uses Animated + PanResponder from core
 * react-native so the same component compiles to web via react-native-web without any
 * native-only gesture lib. The rotation + opacity transforms give the card a subtle
 * "fling" feel; swipe past SWIPE_THRESHOLD pixels either way to fire the callback.
 */
function SwipeableCardComponent({
  profile,
  onSwipeRight,
  onSwipeLeft,
  onPress,
  height,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;

  const reset = useCallback(() => {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const w = Dimensions.get('window').width;
        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: w, y: g.dy },
            duration: 240,
            useNativeDriver: false,
          }).start(() => {
            onSwipeRight?.(profile.id);
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: -w, y: g.dy },
            duration: 240,
            useNativeDriver: false,
          }).start(() => {
            onSwipeLeft?.(profile.id);
            pan.setValue({ x: 0, y: 0 });
          });
        } else if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          onPress?.(profile.id);
          reset();
        } else {
          reset();
        }
      },
      onPanResponderTerminate: reset,
    }),
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`],
  });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = pan.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`${profile.fullName}, ${profile.age}, ${profile.city}. Swipe right to send interest, left to skip.`}
      style={[
        styles.card,
        height ? { height } : { flex: 1 },
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
        },
      ]}
    >
      <View style={styles.photoWrap}>
        {profile.primaryPhotoUrl ? (
          <Image source={{ uri: profile.primaryPhotoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoInitial}>{profile.fullName.charAt(0)}</Text>
          </View>
        )}
        <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Text style={styles.stampTextLike}>INTEREST</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Text style={styles.stampTextNope}>SKIP</Text>
        </Animated.View>
        <View style={styles.badgeWrap}>
          <VerificationBadge tier={profile.verificationTier} compact />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.name}>
          {profile.fullName}, {profile.age}
        </Text>
        <Text style={styles.meta}>
          {profile.height} · {profile.religion} · {profile.city}
        </Text>
        <Text style={styles.meta}>{profile.education}</Text>
      </View>
    </Animated.View>
  );
}

export const SwipeableCard = React.memo(SwipeableCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  photoWrap: { flex: 1, position: 'relative', backgroundColor: colors.primary100 },
  photo: { width: '100%', height: '100%' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 80, color: colors.primary, fontWeight: '800' },
  badgeWrap: { position: 'absolute', top: 14, right: 14 },
  footer: { padding: 18 },
  name: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.ink },
  meta: { color: colors.textMuted, marginTop: 4 },
  stamp: {
    position: 'absolute',
    top: 30,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 3,
  },
  stampLike: {
    left: 24,
    borderColor: colors.success,
    transform: [{ rotate: '-14deg' }],
  },
  stampTextLike: { color: colors.success, fontWeight: '900', letterSpacing: 1.5, fontSize: 22 },
  stampNope: {
    right: 24,
    borderColor: colors.danger,
    transform: [{ rotate: '14deg' }],
  },
  stampTextNope: { color: colors.danger, fontWeight: '900', letterSpacing: 1.5, fontSize: 22 },
});
