'use client';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  textareaStyle,
} from '../../lib/ui';

type Step = 'selfie' | 'video' | 'background';

interface PendingItem {
  id: string;
  profileId: string;
  trustScore: number;
  tier: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  selfieVerified: boolean;
  videoKycVerified: boolean;
  backgroundVerified: boolean;
  selfieKey: string | null;
  videoKey: string | null;
  lastRejectionStep: string | null;
  lastRejectionReason: string | null;
  profile: { id: string; fullName: string; city: string };
}

interface DocPreview {
  selfie: { url: string | null; key: string } | null;
  video: { url: string | null; key: string } | null;
}

export default function Verifications() {
  const [items, setItems] = useState<PendingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<PendingItem | null>(null);
  const [previewData, setPreviewData] = useState<DocPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rejectFor, setRejectFor] = useState<{ item: PendingItem; step: Step } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

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

  async function approve(profileId: string, step: Step) {
    try {
      await api.admin.approveStep(profileId, step);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve step.');
    }
  }

  async function openPreview(item: PendingItem) {
    setPreviewFor(item);
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      const data = (await api.admin.verificationDocuments(item.profileId)) as DocPreview;
      setPreviewData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load documents.');
      setPreviewFor(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function openReject(item: PendingItem, step: Step) {
    setRejectFor({ item, step });
    setRejectReason('');
  }

  async function submitReject() {
    if (!rejectFor) return;
    if (rejectReason.trim().length < 4) {
      setError('Rejection reason must be at least 4 characters.');
      return;
    }
    setRejectBusy(true);
    try {
      await api.admin.rejectStep(rejectFor.item.profileId, rejectFor.step, rejectReason.trim());
      setRejectFor(null);
      setRejectReason('');
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reject step.');
    } finally {
      setRejectBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Trust"
        title="Verification queue"
        subtitle="Review the documents the user submitted, then approve or reject with feedback. Each action is audit-logged."
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
              <th style={{ width: 320 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8}>
                    <Skeleton height={14} style={{ margin: '6px 0' }} />
                  </td>
                </tr>
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
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.profile?.fullName ?? '—'}</div>
                    {v.lastRejectionStep ? (
                      <div style={{ marginTop: 4 }}>
                        <Chip label={`Last rejected: ${v.lastRejectionStep}`} tone="warn" />
                      </div>
                    ) : null}
                  </td>
                  <td>{v.profile?.city ?? '—'}</td>
                  <td>{v.trustScore}</td>
                  <td>
                    <Chip
                      label={v.tier}
                      tone={v.tier === 'PREMIUM' ? 'accent' : v.tier === 'VERIFIED' ? 'success' : 'neutral'}
                    />
                  </td>
                  <td>
                    <StepCell verified={v.selfieVerified} hasDoc={!!v.selfieKey} />
                  </td>
                  <td>
                    <StepCell verified={v.videoKycVerified} hasDoc={!!v.videoKey} />
                  </td>
                  <td>
                    <StepCell verified={v.backgroundVerified} hasDoc={false} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(v.selfieKey || v.videoKey) ? (
                        <Button size="sm" variant="outline" onClick={() => openPreview(v)}>
                          View docs
                        </Button>
                      ) : null}
                      {!v.selfieVerified ? (
                        <>
                          <Button size="sm" onClick={() => approve(v.profileId, 'selfie')}>
                            ✓ Selfie
                          </Button>
                          {v.selfieKey ? (
                            <Button size="sm" variant="ghost" onClick={() => openReject(v, 'selfie')}>
                              ✕ Selfie
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      {!v.videoKycVerified ? (
                        <>
                          <Button size="sm" onClick={() => approve(v.profileId, 'video')}>
                            ✓ Video
                          </Button>
                          {v.videoKey ? (
                            <Button size="sm" variant="ghost" onClick={() => openReject(v, 'video')}>
                              ✕ Video
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      {!v.backgroundVerified ? (
                        <>
                          <Button size="sm" onClick={() => approve(v.profileId, 'background')}>
                            ✓ BG
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openReject(v, 'background')}>
                            ✕ BG
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Doc preview modal */}
      <Modal
        open={!!previewFor}
        onClose={() => setPreviewFor(null)}
        title={`Documents — ${previewFor?.profile?.fullName ?? ''}`}
        width={640}
      >
        {previewLoading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <Skeleton height={300} />
            <Skeleton height={20} width="40%" />
          </div>
        ) : !previewData || (!previewData.selfie && !previewData.video) ? (
          <EmptyState
            title="No documents"
            description="The user hasn't uploaded a selfie or video yet, or the keys aren't recorded on their verification."
          />
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {previewData.selfie?.url ? (
              <section>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Selfie</h4>
                <img
                  src={previewData.selfie.url}
                  alt="Submitted selfie"
                  style={{
                    width: '100%',
                    maxHeight: 380,
                    objectFit: 'contain',
                    borderRadius: 12,
                    background: 'var(--surface-alt)',
                  }}
                />
              </section>
            ) : null}
            {previewData.video?.url ? (
              <section>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Video KYC</h4>
                <video
                  src={previewData.video.url}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: 420,
                    borderRadius: 12,
                    background: '#000',
                  }}
                />
              </section>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectFor}
        onClose={() => setRejectFor(null)}
        title={`Reject ${rejectFor?.step ?? ''} step`}
      >
        <Banner variant="warn">
          The user will see your reason on /verify and receive a notification asking them to
          resubmit. Be specific — they don't get a back-and-forth chat with you.
        </Banner>
        <Field label="Reason" required hint="4–500 characters. Quoted to the user verbatim.">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ ...textareaStyle, minHeight: 120 }}
            placeholder="e.g. Selfie is too dark — please retake in good lighting facing the camera."
            maxLength={500}
            autoFocus
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
          <Button variant="danger" onClick={submitReject} loading={rejectBusy}>Send rejection</Button>
        </div>
      </Modal>
    </>
  );
}

function StepCell({ verified, hasDoc }: { verified: boolean; hasDoc: boolean }) {
  if (verified) return <span style={{ color: 'var(--success, #2e7d5b)', fontWeight: 700 }}>✓</span>;
  if (hasDoc) return <span style={{ color: 'var(--accent-dark, #9e7f3f)', fontWeight: 700 }}>•</span>;
  return <span style={{ color: 'var(--muted)' }}>—</span>;
}
