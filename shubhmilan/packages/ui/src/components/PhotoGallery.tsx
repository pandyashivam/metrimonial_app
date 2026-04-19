import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, fontSizes, radii, spacing } from '../tokens.js';

export interface Photo {
  id: string;
  url: string;
  privacy?: 'PUBLIC' | 'MEMBERS' | 'REQUEST';
  blurhash?: string;
}

export interface PhotoGalleryProps {
  photos: Photo[];
  /** How tall the thumbnail strip is. Default: 120. */
  thumbnailSize?: number;
  /** Callback when REQUEST-gated photo is tapped. The lightbox stays closed. */
  onRequestAccess?: (photo: Photo) => void;
}

/**
 * Horizontal thumbnail strip + tap-to-fullscreen lightbox. REQUEST-privacy photos show
 * a locked overlay until the viewer's interest is accepted.
 */
export function PhotoGallery({ photos, thumbnailSize = 120, onRequestAccess }: PhotoGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <>
      <FlatList
        horizontal
        data={photos}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item, index }) => {
          const locked = item.privacy === 'REQUEST';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={locked ? 'Locked photo — request access' : 'Open photo'}
              onPress={() => {
                if (locked) {
                  onRequestAccess?.(item);
                } else {
                  setActiveIdx(index);
                }
              }}
              style={[
                styles.thumb,
                { width: thumbnailSize, height: thumbnailSize * 1.25 },
              ]}
            >
              <Image source={{ uri: item.url }} style={styles.thumbImg} />
              {locked ? (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.lockText}>Request</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No photos yet</Text>
        }
      />

      <Modal
        visible={activeIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveIdx(null)}
      >
        <Pressable style={styles.fullscreen} onPress={() => setActiveIdx(null)}>
          <FlatList
            horizontal
            pagingEnabled
            data={photos}
            keyExtractor={(p) => p.id}
            initialScrollIndex={activeIdx ?? 0}
            getItemLayout={(_, i) => {
              const w = Dimensions.get('window').width;
              return { length: w, offset: w * i, index: i };
            }}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const w = Dimensions.get('window').width;
              setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / w));
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{
                  width: Dimensions.get('window').width,
                  height: '100%',
                  resizeMode: 'contain',
                }}
              />
            )}
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.primary100 },
  thumbImg: { width: '100%', height: '100%' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,14,18,0.55)',
    gap: 4,
  },
  lockIcon: { fontSize: 28 },
  lockText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.xs + 1 },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
  fullscreen: { flex: 1, backgroundColor: '#000' },
});
