'use client';
import { useState, useEffect } from 'react';

interface Participation { id: number; approvalStatus: string; pointsEarned: number; proofFileName: string; employee: { name: string }; activity?: { title: string; evidenceRequired: boolean } | null; challenge?: { title: string } | null; }

export default function ParticipationPage() {
  const [items, setItems] = useState<Participation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { fetch('/api/participations').then(r => r.json()).then(setItems); }, []);

  const handleAction = async (id: number, status: string) => {
    setError('');
    const res = await fetch('/api/participations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approvalStatus: status }) });
    if (res.ok) { setItems(items.map(i => i.id === id ? { ...i, approvalStatus: status } : i)); }
    else { const d = await res.json(); setError(d.error || 'Action failed'); }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Employee Participation</h1><p className="page-subtitle">Review and approve participation requests</p></div></div>
      {error && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '13px', marginBottom: '18px' }}>{error}</div>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Activity / Challenge</th><th>Proof</th><th>Points</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.employee.name}</td>
                <td>{p.activity?.title || p.challenge?.title || '—'}</td>
                <td>{p.proofFileName ? <span className="badge badge-green">📎 {p.proofFileName}</span> : <span className="badge badge-gray">No proof</span>}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>+{p.pointsEarned}</span></td>
                <td><span className={`badge ${p.approvalStatus === 'Approved' ? 'badge-green' : p.approvalStatus === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>{p.approvalStatus}</span></td>
                <td>
                  {p.approvalStatus === 'Pending' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAction(p.id, 'Approved')}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(p.id, 'Rejected')}>✗ Reject</button>
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
