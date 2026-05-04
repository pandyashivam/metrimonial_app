/**
 * Loads Inter + Playfair Display from Google Fonts on web.
 *
 * No-ops on native — the same fonts should be packaged via `expo-font` /
 * `assets/fonts` for iOS + Android, but that's a separate concern from making
 * the web build look right today.
 *
 * Idempotent: safe to call from a useEffect; the check guards against double
 * insertion when components remount.
 */

import { Platform } from 'react-native';

const LINK_ID = 'shubhmilan-web-fonts';

const HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700;800' +
  '&family=Playfair+Display:wght@500;600;700;800' +
  '&display=swap';

export function loadWebFonts() {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(LINK_ID)) return;

  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';

  const link = document.createElement('link');
  link.id = LINK_ID;
  link.rel = 'stylesheet';
  link.href = HREF;

  document.head.appendChild(preconnect1);
  document.head.appendChild(preconnect2);
  document.head.appendChild(link);
}
