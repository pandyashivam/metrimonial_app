'use client';

import { useEffect } from 'react';

import { Banner, Button } from '../lib/ui';

/**
 * Next.js error boundary — caught above the page render. Logs the error so we
 * can find it in the console / logs, and gives the operator a way back. We
 * deliberately don't show stack traces in the UI; this is an internal tool but
 * the message tends to be confusing without context.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] uncaught error', error);
  }, [error]);

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: 24 }}>
      <Banner variant="error" title="Something went wrong">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </Banner>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
        Try reloading. If this keeps happening, capture the URL and the time, and check the API
        and browser console for matching errors.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <Button onClick={reset}>Reload this page</Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>Go to dashboard</Button>
      </div>
    </div>
  );
}
