/**
 * Cross-platform image picking + client-side resize/compress.
 *
 * Returns a Blob (ready to FormData-upload) and the picked file's MIME type.
 * Resize-to-max-width happens on the client to protect bandwidth and storage —
 * 1600px is a good ceiling for matrimonial profile photos.
 *
 *   • Native (iOS/Android): expo-image-picker + expo-image-manipulator.
 *   • Web: hidden <input type="file"> + canvas resize, no Expo modules used.
 *
 * Returns null when the user cancels. Rejects only on actual errors (permission
 * denied, malformed file, encoder failure).
 */

import { Platform } from 'react-native';

export interface PickedImage {
  blob: Blob;
  mime: string;
}

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

export async function pickImage(): Promise<PickedImage | null> {
  return Platform.OS === 'web' ? pickWeb() : pickNative();
}

/**
 * Pick an image and return its raw bytes — convenient for callers that need to
 * encrypt the payload before upload (e.g. chat E2E media envelope).
 */
export async function pickImageBytes(): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const picked = await pickImage();
  if (!picked) return null;
  const buf = await picked.blob.arrayBuffer();
  return { bytes: new Uint8Array(buf), mime: picked.mime };
}

// ---------- Native ----------

async function pickNative(): Promise<PickedImage | null> {
  const ImagePicker = await import('expo-image-picker');
  const ImageManipulator = await import('expo-image-manipulator');

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.9,
  });
  if (res.canceled || !res.assets.length) return null;

  const asset = res.assets[0]!;
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  const blob = await (await fetch(manipulated.uri)).blob();
  return { blob, mime: 'image/jpeg' };
}

// ---------- Web ----------

async function pickWeb(): Promise<PickedImage | null> {
  if (typeof document === 'undefined') return null;

  const file = await openFilePicker();
  if (!file) return null;

  const resized = await resizeOnCanvas(file, MAX_WIDTH, JPEG_QUALITY);
  return { blob: resized, mime: 'image/jpeg' };
}

function openFilePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    input.addEventListener('change', () => {
      settled = true;
      const file = input.files?.[0] ?? null;
      cleanup();
      resolve(file);
    });
    // Browsers don't fire a 'cancel' event reliably across versions. Fall back
    // to focus-on-window: when the dialog closes the window regains focus.
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(null);
        }
      }, 250);
    };
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

async function resizeOnCanvas(file: File, maxWidth: number, quality: number): Promise<Blob> {
  // Decode the image with EXIF orientation already applied. Without this,
  // iPhone selfies (which carry orientation=6 EXIF) end up rotated 90° when
  // drawn to a canvas — a frequent web upload bug. createImageBitmap +
  // imageOrientation:'from-image' is supported on Chrome/Edge/Firefox/Safari
  // 14+. Fall back to the old <img> path for older browsers (orientation
  // will be ignored, matching previous behaviour).
  const source = await decodeWithOrientation(file);
  const ratio = Math.min(1, maxWidth / source.width);
  const w = Math.round(source.width * ratio);
  const h = Math.round(source.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported in this browser');
  ctx.drawImage(source.bitmap, 0, 0, w, h);
  // Free GPU memory immediately on browsers that support it.
  if ('close' in source.bitmap && typeof (source.bitmap as { close?: () => void }).close === 'function') {
    (source.bitmap as { close: () => void }).close();
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))),
      'image/jpeg',
      quality,
    );
  });
}

interface DecodedImage {
  bitmap: CanvasImageSource;
  width: number;
  height: number;
}

async function decodeWithOrientation(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' as ImageOrientation });
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to the <img> path. Some browsers reject the option but
      // still provide createImageBitmap for the basic call — try that first.
      try {
        const bitmap = await createImageBitmap(file);
        return { bitmap, width: bitmap.width, height: bitmap.height };
      } catch {
        /* fall through to img */
      }
    }
  }
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });
}
