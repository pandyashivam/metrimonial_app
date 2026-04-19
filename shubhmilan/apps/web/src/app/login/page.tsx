import { headers } from 'next/headers';
import Link from 'next/link';

export const metadata = { title: 'Sign in' };

function isMobile(ua: string): boolean {
  return /iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile|webOS/i.test(ua);
}

/**
 * Device-aware entry point. Mobile users get bounced to the native app via the custom scheme
 * with a store fallback in case the app isn't installed. Desktop users see a form pointing
 * them at the web build of the Expo app (typically hosted at /app by a CDN), plus store links.
 */
export default function Login() {
  const ua = headers().get('user-agent') ?? '';
  const onMobile = isMobile(ua);

  // Deep link; if the app isn't installed, document.location falls through and we redirect to stores.
  if (onMobile) {
    return (
      <>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var ua = navigator.userAgent;
                var store = /iPhone|iPad|iPod/i.test(ua)
                  ? 'https://apps.apple.com/app/shubhmilan/id000000000'
                  : 'https://play.google.com/store/apps/details?id=org.tenderfy.shubhmilan';
                var t = Date.now();
                window.location.href = 'shubhmilan://login';
                setTimeout(function () {
                  if (Date.now() - t < 1600) { window.location.href = store; }
                }, 1200);
              })();
            `,
          }}
        />
        <main className="container section" style={{ textAlign: 'center' }}>
          <h1>Opening the ShubhMilan app…</h1>
          <p style={{ color: 'var(--muted)' }}>
            Not redirected? <Link href="shubhmilan://login">Tap here</Link> or install the app:
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <a
              href="https://apps.apple.com/app/shubhmilan/id000000000"
              className="btn btn-primary"
            >
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=org.tenderfy.shubhmilan"
              className="btn btn-primary"
            >
              Google Play
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="container section" style={{ maxWidth: 440 }}>
      <h1 style={{ fontSize: 32 }}>Sign in to ShubhMilan</h1>
      <p style={{ color: 'var(--muted)' }}>
        The full experience lives in our app. On desktop, open the web app at{' '}
        <Link href="/app">/app</Link> (hosted from our Expo web build), or install the native app:
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <a
          href="https://apps.apple.com/app/shubhmilan/id000000000"
          className="btn btn-primary"
        >
          iOS App Store
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=org.tenderfy.shubhmilan"
          className="btn btn-primary"
        >
          Google Play
        </a>
      </div>
      <p style={{ marginTop: 28, fontSize: 14, color: 'var(--muted)' }}>
        New here? <Link href="/signup">Create a free profile →</Link>
      </p>
    </main>
  );
}
