# @shubhmilan/mobile

Expo (SDK 51) Router app. **One codebase that ships on three platforms:**

| Platform | How | Who bundles it |
|---|---|---|
| **iOS** | Expo → Xcode project | Metro (React Native) |
| **Android** | Expo → Gradle project | Metro (React Native) |
| **Web** | Static SPA, deployable to any CDN | Metro with `react-native` → `react-native-web` alias |

No fork, no platform branches in our code — metro's resolver does the swap at build time.

## Commands

```bash
pnpm dev            # interactive Expo dev menu on :8081
pnpm ios            # iOS simulator (macOS only)
pnpm android        # Android emulator
pnpm web            # web dev server — hit open-in-browser
pnpm build:web      # static export to ./dist for CDN deploy
```

## Code sharing

- **UI primitives** live in `@shubhmilan/ui` — 10 RN components (`Button`, `Input`, `Card`, `Chip`, `Avatar`, `ProfileCard`, `VerificationBadge`, `AIScoreBadge`, `TrustDonut`, `EmptyState`). They use `View`, `Text`, `Pressable`, `StyleSheet` — everything react-native-web can render unchanged.
- **Data layer** is the typed `@shubhmilan/api-client`. Zero platform dependencies.
- **Encryption** uses `tweetnacl` (pure JS) with `expo-crypto` for randomness — both work in Node, RN, and the browser.
- **Form validation** pulls Zod schemas from `@shubhmilan/validation` — the same ones the server enforces.

## Environment

Defaults to `http://localhost:4000/api/v1`. To point at a different API:

```
EXPO_PUBLIC_API_URL=https://api.shubhmilan.com/v1
EXPO_PUBLIC_WS_URL=wss://api.shubhmilan.com
```

## Deploying the web build

```bash
pnpm build:web
# → ./dist (static HTML + JS)
# drop into any CDN (Vercel static, Cloudflare Pages, S3+CloudFront, etc.)
```

## Platform quirks

- **expo-secure-store** maps to iOS Keychain + Android Keystore natively; on web it falls back to `localStorage`. The E2E chat private key thus has slightly weaker protection in the browser (any XSS could exfiltrate it). Consider migrating to Web Crypto API non-extractable keys if this becomes a concern.
- **expo-notifications** works best on native (APNs / FCM); web support is the Web Push API, limited on iOS Safari.
- **Deep links** (`shubhmilan://profile/:id`) only fire on native; web uses standard URLs.
