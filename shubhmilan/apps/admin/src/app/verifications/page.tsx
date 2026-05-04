'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import { Banner, Button, Chip, EmptyState, PageHeader, Skeleton } from '../../lib/ui';

interface PendingItem {
  id: string;
  profileId: string;
  trustScore: number;
  tier: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  selfieVerified: boolean;
  videoKycVerified: boolean;
  backgroundVerified: boolean;
  profile: { id: string; fullName: string; city: string };
}

export default function Verifications() {
  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = (await api.admin.pendingVerifications()) as PendingItem[];
      setItems(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load queue.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(profileId: string, step: 'selfie' | 'video' | 'background') {
    try {
      await api.admin.approveStep(profileId, step);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve step.');
    }
  }

  return (
    <>
      <PageHeader
        kicker="Trust"
        title="Verification queue"
        subtitle="Review pending KYC steps and approve them. Each approval boosts the member's trust score."
      />
      {error ? <Banner>{error}</Banner> : null}
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
              <th style={{ width: 220 }}>Approve</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={8}><Skeleton height={14} style={{ margin: '6px 0' }} /></td></tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  <EmptyState
                    title="Queue is clear"
                    description="No pending verification steps. New submissions will appear here."
                  />
                </td>
              </tr>
            ) : (
              items.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.profile?.fullName ?? '—'}</td>
                  <td>{v.profile?.city ?? '—'}</td>
                  <td>{v.trustScore}</td>
                  <td>
                    <Chip
                      label={v.tier}
                      tone={v.tier === 'PREMIUM' ? 'accent' : v.tier === 'VERIFIED' ? 'success' : 'neutral'}
                    />
                  </td>
                  <td>{v.selfieVerified ? '✓' : '—'}</td>
                  <td>{v.videoKycVerified ? '✓' : '—'}</td>
                  <td>{v.backgroundVerified ? '✓' : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!v.selfieVerified && (
                        <Button size="sm" onClick={() => approve(v.profileId, 'selfie')}>Selfie</Button>
                      )}
                      {!v.videoKycVerified && (
                        <Button size="sm" onClick={() => approve(v.profileId, 'video')}>Video</Button>
                      )}
                      {!v.backgroundVerified && (
                        <Button size="sm" onClick={() => approve(v.profileId, 'background')}>BG</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
