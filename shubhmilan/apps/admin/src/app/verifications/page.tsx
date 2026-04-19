'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

interface PendingItem {
  id: string;
  profileId: string;
  trustScore: number;
  tier: string;
  selfieVerified: boolean;
  videoKycVerified: boolean;
  backgroundVerified: boolean;
  profile: { id: string; fullName: string; city: string };
}

export default function Verifications() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = (await api.admin.pendingVerifications()) as PendingItem[];
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(profileId: string, step: 'selfie' | 'video' | 'background') {
    await api.admin.approveStep(profileId, step);
    load();
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Verification queue</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Profile</th>
              <th>City</th>
              <th>Trust</th>
              <th>Tier</th>
              <th>Selfie</th>
              <th>Video</th>
              <th>Background</th>
              <th>Approve</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  Loading…
                </td>
              </tr>
            )}
            {items.map((v) => (
              <tr key={v.id}>
                <td>{v.profile?.fullName ?? '—'}</td>
                <td>{v.profile?.city ?? '—'}</td>
                <td>{v.trustScore}</td>
                <td>{v.tier}</td>
                <td>{v.selfieVerified ? '✓' : '—'}</td>
                <td>{v.videoKycVerified ? '✓' : '—'}</td>
                <td>{v.backgroundVerified ? '✓' : '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {!v.selfieVerified && (
                    <button onClick={() => approve(v.profileId, 'selfie')} style={aprBtn}>
                      Selfie
                    </button>
                  )}
                  {!v.videoKycVerified && (
                    <button onClick={() => approve(v.profileId, 'video')} style={aprBtn}>
                      Video
                    </button>
                  )}
                  {!v.backgroundVerified && (
                    <button onClick={() => approve(v.profileId, 'background')} style={aprBtn}>
                      BG
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const aprBtn: React.CSSProperties = {
  background: '#1e8a5f',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};
