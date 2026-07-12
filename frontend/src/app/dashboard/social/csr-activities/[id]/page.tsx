'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Activity {
  id: number;
  title: string;
  description: string;
  icon: string;
  evidenceRequired: boolean;
  joinCount: number;
  status: string;
  category?: { name: string };
  department?: { name: string };
}

interface Participation {
  id: number;
  activityId: number;
  employeeId: number;
  approvalStatus: string;
  proofFileName: string;
  pointsEarned: number;
}

export default function CSRActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proof, setProof] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
        }

        const actRes = await fetch(`/api/csr-activities/${id}`);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivity(actData);
        }

        const partRes = await fetch('/api/participations');
        if (partRes.ok) {
          const partData = await partRes.json();
          const found = partData.find(
            (p: any) => p.activityId === parseInt(id) && p.employeeId === meData.user?.id
          );
          if (found) {
            setParticipation(found);
            setProof(found.proofFileName || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleJoin = async () => {
    setError('');
    try {
      const res = await fetch('/api/csr-activities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: parseInt(id) }),
      });
      if (res.ok) {
        const p = await res.json();
        setParticipation(p);
        setSuccess('Joined activity successfully!');
        if (activity) {
          setActivity({ ...activity, joinCount: activity.joinCount + 1 });
        }
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to join');
      }
    } catch {
      setError('Connection error');
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof.trim()) {
      setError('Please provide proof of completion (e.g. proof filename or reference text).');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/participations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participation?.id, proofFileName: proof }),
      });
      if (res.ok) {
        const p = await res.json();
        setParticipation(p);
        setSuccess('Proof submitted successfully!');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to submit proof');
      }
    } catch {
      setError('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading activity details...</div>;
  }

  if (!activity) {
    return (
      <div style={{ padding: '24px' }}>
        <h3>Activity not found</h3>
        <Link href="/dashboard/social/csr-activities" className="btn btn-secondary btn-sm">
          Back to Activities
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard/social/csr-activities" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          ← Back to CSR Activities
        </Link>
      </div>

      <div className="card card-blue" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '36px' }}>{activity.icon}</span>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>{activity.title}</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {activity.category && <span className="badge badge-blue">{activity.category.name}</span>}
              {activity.department && <span className="badge badge-blue">{activity.department.name}</span>}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
          {activity.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px', borderTop: '1px solid var(--border-default)', paddingTop: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
              <span className={`badge ${activity.status === 'Open' ? 'badge-green' : 'badge-gray'}`}>{activity.status}</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Volunteers Joined</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
              👥 {activity.joinCount} employees
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
          {!participation ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Join this activity to start participating and earn 25 EcoPoints!
              </p>
              <button className="btn btn-blue" onClick={handleJoin} disabled={activity.status !== 'Open'}>
                Join CSR Activity
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Your Participation</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <span className="badge badge-blue">Joined</span>
                <span className={`badge ${participation.approvalStatus === 'Approved' ? 'badge-green' : participation.approvalStatus === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>
                  Verification: {participation.approvalStatus}
                </span>
              </div>

              {participation.approvalStatus === 'Approved' ? (
                <p style={{ color: '#22c55e', margin: 0, fontSize: '14px', fontWeight: 600 }}>
                  ✓ This activity has been approved by your manager. You earned {participation.pointsEarned} EcoPoints!
                </p>
              ) : (
                <form onSubmit={handleSubmitProof}>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '8px' }}>
                      Submit Completion Proof
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={proof}
                      onChange={e => setProof(e.target.value)}
                      placeholder="e.g. Activity photo filename, volunteer certificate link, or summary reference"
                      required
                      disabled={participation.approvalStatus === 'Pending' && participation.proofFileName !== ''}
                    />
                  </div>
                  {participation.proofFileName && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                      Submitted Proof: <strong>{participation.proofFileName}</strong>
                    </p>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || (participation.approvalStatus === 'Pending' && participation.proofFileName !== '')}
                  >
                    {submitting ? 'Submitting...' : 'Submit Proof'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
