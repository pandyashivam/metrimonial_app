export default function Transactions() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Transactions</h1>
      <p style={{ color: 'var(--muted)' }}>
        Razorpay ledger lives in the provider dashboard. This page shows our local subscription
        lifecycle rows; webhooks write them on payment.captured / payment.failed.
      </p>
      <div className="card" style={{ marginTop: 20 }}>
        <p style={{ color: 'var(--muted)' }}>
          Wire <code>/api/v1/admin/transactions</code> when you want this in-app. Until then,
          browse in Prisma Studio: <code>pnpm db:studio</code>.
        </p>
      </div>
    </>
  );
}
