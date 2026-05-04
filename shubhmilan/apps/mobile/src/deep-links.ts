import * as Linking from 'expo-linking';
import type { Router } from 'expo-router';

/**
 * Deep-link URL patterns supported by the app. Mirrored in:
 *   - apps/mobile/app.json  (scheme / associatedDomains / intentFilters)
 *
 * Both custom scheme (`shubhmilan://`) and universal links (`https://shubhmilan.com/...`)
 * route to the same handler so share links work in both forms.
 *
 * Web build caveat: custom-scheme links (`shubhmilan://...`) DO NOT resolve on
 * web — `Linking.parse` returns null for non-HTTP URLs. Outbound communications
 * (emails, marketing, push notifications) targeting the web build must therefore
 * use HTTPS URLs. Native apps continue to handle both.
 */
const PATTERNS: Array<{ match: RegExp; route: (m: RegExpMatchArray) => string }> = [
  { match: /^\/?profile\/([a-zA-Z0-9_-]+)$/i, route: (m) => `/profile/${m[1]}` },
  { match: /^\/?chat\/([a-zA-Z0-9_-]+)$/i, route: (m) => `/chat/${m[1]}` },
  { match: /^\/?kundli\/([a-zA-Z0-9_-]+)$/i, route: (m) => `/kundli/${m[1]}` },
  { match: /^\/?verify\/?$/i, route: () => '/verify' },
  { match: /^\/?settings\/?$/i, route: () => '/settings' },
  { match: /^\/?premium\/?$/i, route: () => '/premium' },
  { match: /^\/?filters\/?$/i, route: () => '/filters' },
  { match: /^\/?login\/?$/i, route: () => '/(auth)/login' },
  { match: /^\/?signup\/?$/i, route: () => '/(auth)/signup' },
];

function urlToRoute(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? '';
    for (const p of PATTERNS) {
      const m = ('/' + path).match(p.match);
      if (m) return p.route(m);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Wires Linking's initial-URL + live URL subscribers to the supplied router. Call once
 * inside the root layout AFTER auth hydration so we don't bounce past the login screen.
 */
export async function attachDeepLinks(
  router: Router,
  isAuthenticated: () => boolean,
): Promise<() => void> {
  const handle = (url: string | null) => {
    if (!url) return;
    const target = urlToRoute(url);
    if (!target) return;

    // If the user is not authenticated and the deep link requires auth, hold the intent
    // in memory so we can resume it right after login. Public routes (login/signup) go
    // through immediately.
    const isPublic = target.startsWith('/(auth)');
    if (!isAuthenticated() && !isPublic) {
      pendingIntent = target;
      router.replace('/(auth)/welcome');
      return;
    }
    router.push(target);
  };

  const initial = await Linking.getInitialURL();
  handle(initial);
  const sub = Linking.addEventListener('url', ({ url }) => handle(url));
  return () => sub.remove();
}

let pendingIntent: string | null = null;

/** Called from the login flow after tokens are set. Drains any pending deep-link intent. */
export function resumePendingIntent(router: Router): boolean {
  if (!pendingIntent) return false;
  const target = pendingIntent;
  pendingIntent = null;
  router.replace(target);
  return true;
}
