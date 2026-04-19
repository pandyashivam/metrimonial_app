import { headers } from 'next/headers';
import Link from 'next/link';

export const metadata = { title: 'Create a profile' };

function isMobile(ua: string): boolean {
  return /iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile|webOS/i.test(ua);
}

export default function Signup() {
  const onMobile = isMobile(headers().get('user-agent') ?? '');
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
                window.location.href = 'shubhmilan://signup';
                setTimeout(function () {
                  if (Date.now() - t < 1600) { window.location.href = store; }
                }, 1200);
              })();
            `,
          }}
        />
        <main className="container section" style={{ textAlign: 'center' }}>
          <h1>Opening the ShubhMilan app…</h1>
          <p style={{ color: 'var(--muted)' }}>We&apos;re redirecting you.</p>
        </main>
      </>
    );
  }
  return (
    <main className="container section" style={{ maxWidth: 440 }}>
      <h1 style={{ fontSize: 32 }}>Create your free profile</h1>
      <p style={{ color: 'var(--muted)' }}>
        Signing up happens in our app for security. Install via your app store:
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
      <p style={{ marginTop: 28 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
