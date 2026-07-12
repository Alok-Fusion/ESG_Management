'use client';
import { useState, useEffect } from 'react';

interface CP { id: number; progressPct: number; proofFileName: string; approvalStatus: string; xpAwarded: number; employee: { name: string }; challenge: { title: string; xp: number } }

export default function ChallengeParticipationPage() {
  const [items, setItems] = useState<CP[]>([]);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('Employee');

  useEffect(() => {
    fetch('/api/challenge-participations').then(r => r.json()).then(setItems);
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.role) setUserRole(d.user.role); });
  }, []);

  const handleAction = async (id: number, status: string) => {
    setError('');
    const res = await fetch('/api/challenge-participations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approvalStatus: status }) });
    if (res.ok) { const updated = await res.json(); setItems(items.map(i => i.id === id ? { ...i, approvalStatus: status, xpAwarded: updated.xpAwarded } : i)); }
    else { const d = await res.json(); setError(d.error); }
  };

  if (userRole === 'Employee') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to manage and approve challenge participations.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Challenge Participation</h1><p className="page-subtitle">Review challenge completions and award XP</p></div></div>
      {error && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '13px', marginBottom: '18px' }}>{error}</div>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Challenge</th><th>Progress</th><th>Proof</th><th>XP</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.employee.name}</td>
                <td>{p.challenge.title}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: '80px' }}><div className="progress-fill" style={{ width: `${p.progressPct}%`, background: 'var(--accent-orange)' }} /></div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.progressPct}%</span>
                  </div>
                </td>
                <td>{p.proofFileName ? <span className="badge badge-green">📎 {p.proofFileName}</span> : <span className="badge badge-gray">None</span>}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--accent-orange)' }}>{p.xpAwarded || p.challenge.xp} XP</span></td>
                <td><span className={`badge ${p.approvalStatus === 'Approved' ? 'badge-green' : p.approvalStatus === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>{p.approvalStatus}</span></td>
                <td>
                  {p.approvalStatus === 'Pending' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAction(p.id, 'Approved')}>✓</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(p.id, 'Rejected')}>✗</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
