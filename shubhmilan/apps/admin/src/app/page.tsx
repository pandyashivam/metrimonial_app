export default function Dashboard() {
  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)' }}>
        Live KPIs — DAU, MAU, signups, revenue, open reports. Wire to /api/v1/admin/stats once the
        admin backend routes are implemented.
      </p>

      <div className="grid grid-4" style={{ marginTop: 24 }}>
        {[
          { label: 'Daily active users', value: '—' },
          { label: 'Monthly active', value: '—' },
          { label: 'Signups today', value: '—' },
          { label: 'Open reports', value: '—' },
        ].map((k) => (
          <div key={k.label} className="card">
            <div className="kpi">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent signups</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ color: 'var(--muted)' }}>
                Connect to /api/v1/admin/users for live data.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
