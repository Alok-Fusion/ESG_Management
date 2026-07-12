'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Challenge {
  id: number;
  title: string;
  description: string;
  xp: number;
  difficulty: string;
  evidenceRequired: boolean;
  deadline: string;
  status: string;
  category?: { name: string };
}

interface ChallengeParticipation {
  id: number;
  challengeId: number;
  employeeId: number;
  progressPct: number;
  approvalStatus: string;
  proofFileName: string;
  xpAwarded: number;
}

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participation, setParticipation] = useState<ChallengeParticipation | null>(null);
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

        const chalRes = await fetch(`/api/challenges/${id}`);
        if (chalRes.ok) {
          const chalData = await chalRes.json();
          setChallenge(chalData);
        }

        const partRes = await fetch('/api/challenge-participations');
        if (partRes.ok) {
          const partData = await partRes.json();
          const found = partData.find(
            (p: any) => p.challengeId === parseInt(id) && p.employeeId === meData.user?.id
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
      const res = await fetch('/api/challenge-participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: parseInt(id) }),
      });
      if (res.ok) {
        const p = await res.json();
        setParticipation(p);
        setSuccess('Joined challenge successfully!');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to join challenge');
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
      const res = await fetch('/api/challenge-participations/complete', {
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
    return <div style={{ padding: '24px' }}>Loading challenge details...</div>;
  }

  if (!challenge) {
    return (
      <div style={{ padding: '24px' }}>
        <h3>Challenge not found</h3>
        <Link href="/dashboard/gamification/challenges" className="btn btn-secondary btn-sm">
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard/gamification/challenges" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          ← Back to Challenges
        </Link>
      </div>

      <div className="card card-orange" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(249,115,22,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--accent-orange)'
          }}>
            T
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '24px' }}>{challenge.title}</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {challenge.category && <span className="badge badge-blue">{challenge.category.name}</span>}
              <span className="badge badge-orange">{challenge.difficulty}</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
          {challenge.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px', borderTop: '1px solid var(--border-default)', paddingTop: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
              <span className={`badge ${challenge.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{challenge.status}</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reward</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', color: 'var(--accent-orange)' }}>
              {challenge.xp} XP / EcoPoints
            </div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Deadline</span>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
              {new Date(challenge.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>

        {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ padding: '12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
          {!participation ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Join this challenge to complete the quest and earn {challenge.xp} EcoPoints!
              </p>
              <button className="btn btn-orange" onClick={handleJoin} disabled={challenge.status !== 'Active'}>
                Join Challenge
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700 }}>Your Challenge Progress</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <span className="badge badge-orange">Enrolled</span>
                <span className={`badge ${participation.approvalStatus === 'Approved' ? 'badge-green' : participation.approvalStatus === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>
                  Verification: {participation.approvalStatus}
                </span>
                <span className="badge badge-gray">{participation.progressPct}% Complete</span>
              </div>

              {participation.approvalStatus === 'Approved' ? (
                <p style={{ color: '#22c55e', margin: 0, fontSize: '14px', fontWeight: 600 }}>
                  ✓ This challenge has been approved by the manager. You earned {participation.xpAwarded} EcoPoints and XP!
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
                      placeholder="e.g. Reference screenshot name, link to file, or verification description"
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
