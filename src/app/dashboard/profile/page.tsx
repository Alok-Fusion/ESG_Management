'use client';

import { useState, useEffect } from 'react';

interface Department {
  id: number;
  name: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

interface UserBadge {
  id: number;
  awardedAt: string;
  badge: Badge;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  xp: number;
  difficulty: string;
  evidenceRequired: boolean;
}

interface ChallengeParticipation {
  id: number;
  progressPct: number;
  proofFileName: string;
  approvalStatus: string;
  xpAwarded: number;
  challenge: Challenge;
}

interface CSRActivity {
  id: number;
  title: string;
  description: string;
  hoursPoints: number;
}

interface EmployeeParticipation {
  id: number;
  completionDate: string;
  hoursContributed: number;
  activity: CSRActivity;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  xpTotal: number;
  pointsBalance: number;
  department?: Department;
  badges?: UserBadge[];
  challengeParticipations?: ChallengeParticipation[];
  employeeParticipations?: EmployeeParticipation[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deptId, setDeptId] = useState('');
  const [password, setPassword] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setDeptId(data.departmentId ? String(data.departmentId) : '');
      } else {
        setError('Failed to load profile details.');
      }
    } catch {
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetch('/api/departments')
      .then((r) => r.json())
      .then(setDepts)
      .catch(console.error);
  }, []);

  const [proofFiles, setProofFiles] = useState<Record<number, string>>({});

  const handleCompleteChallenge = async (participationId: number) => {
    setError('');
    setSuccess('');
    const proofFileName = proofFiles[participationId] || '';

    try {
      const res = await fetch('/api/challenge-participations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participationId, proofFileName }),
      });

      if (res.ok) {
        setSuccess('Challenge submitted for review!');
        fetchProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit challenge proof.');
      }
    } catch {
      setError('Connection failed. Please try again.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          departmentId: deptId ? parseInt(deptId) : null,
          ...(password && { password }),
        }),
      });

      if (res.ok) {
        setSuccess('Profile updated successfully!');
        setPassword('');
        fetchProfile();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile.');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>⏳ Loading user profile...</p>
      </div>
    );
  }

  // XP level calculation helper (100 XP per level)
  const currentXP = profile?.xpTotal || 0;
  const level = Math.floor(currentXP / 100) + 1;
  const xpInCurrentLevel = currentXP % 100;
  const progressPercent = Math.min(Math.max(xpInCurrentLevel, 0), 100);

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Profile Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px 0' }}>User Profile</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Manage your personal info, trace challenges, and explore earned awards.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
        {/* Left Side: Stats and Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 800,
              color: '#000',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.2)',
            }}>
              {profile?.name?.charAt(0) || '?'}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>{profile?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0' }}>
              {profile?.role} • {profile?.department?.name || 'No Department'}
            </p>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Level {level}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{xpInCurrentLevel} / 100 XP</span>
              </div>
              {/* Level Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '4px' }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)' }}>{profile?.pointsBalance}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>EcoPoints</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-blue)' }}>{profile?.badges?.length || 0}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Badges</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings Form */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Edit Information</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Email Address {profile?.role !== 'Admin' && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--accent-red)' }}>(Locked for non-admins)</span>}
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={profile?.role !== 'Admin'}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Department {profile?.role !== 'Admin' && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--accent-red)' }}>(Locked for non-admins)</span>}
                </label>
                <select
                  className="form-select"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  disabled={profile?.role !== 'Admin'}
                >
                  <option value="">Select Department</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Update Password (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Leave blank to keep current"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '13px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ color: 'var(--accent-green)', fontSize: '13px', padding: '8px 12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px' }}>
                  {success}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={updating} style={{ justifyContent: 'center', marginTop: '6px' }}>
                {updating ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Tabbed Galleries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Badge Showcase */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎖️ Earned Badges</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                {profile?.badges?.length || 0} badges earned
              </span>
            </h3>

            {(!profile?.badges || profile.badges.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
                No badges unlocked yet. Join challenges and CSR activities to win badges!
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {profile.badges.map((ub) => (
                  <div
                    key={ub.id}
                    style={{
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{ub.badge.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{ub.badge.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                        {ub.badge.description}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                        +{ub.badge.xpReward} XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Challenges & CSR Activity Tracks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
            {/* Challenge Track */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>🏆 Active Challenges</h3>
              {(!profile?.challengeParticipations || profile.challengeParticipations.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
                  Not enrolled in any challenges.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.challengeParticipations.map((cp) => (
                    <div
                      key={cp.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{cp.challenge.title}</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: cp.approvalStatus === 'Approved' ? 'rgba(34,197,94,0.15)' : cp.approvalStatus === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          color: cp.approvalStatus === 'Approved' ? 'var(--accent-green)' : cp.approvalStatus === 'Rejected' ? 'var(--accent-red)' : 'var(--accent-blue)',
                          fontWeight: 700,
                        }}>
                          {cp.approvalStatus}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                        {cp.challenge.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cp.progressPct < 100 ? '10px' : '0' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
                          +{cp.challenge.xp} XP
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Progress: {cp.progressPct}%
                        </span>
                      </div>

                      {cp.progressPct < 100 && (
                        <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: '8px', marginTop: '8px' }}>
                          {cp.challenge.evidenceRequired ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Completion Evidence / Receipt</label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. receipt_ref.pdf or description"
                                  style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}
                                  value={proofFiles[cp.id] || ''}
                                  onChange={(e) => setProofFiles({ ...proofFiles, [cp.id]: e.target.value })}
                                />
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                                  onClick={() => handleCompleteChallenge(cp.id)}
                                >
                                  Submit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ width: '100%', fontSize: '12px', justifyContent: 'center' }}
                              onClick={() => handleCompleteChallenge(cp.id)}
                            >
                              Complete Challenge
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CSR Activities Track */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>🌱 CSR Participation</h3>
              {(!profile?.employeeParticipations || profile.employeeParticipations.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
                  No CSR activities completed.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.employeeParticipations.map((ep) => (
                    <div
                      key={ep.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        {ep.activity.title}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                        {ep.activity.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Hours: {ep.hoursContributed} hrs</span>
                        <span>Date: {new Date(ep.completionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
