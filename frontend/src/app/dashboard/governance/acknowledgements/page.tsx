'use client';
import { useState, useEffect } from 'react';

interface Ack { id: number; status: string; acknowledgedAt: string | null; policy: { title: string; category: string; mandatory: boolean } }
interface Policy { id: number; title: string; category: string; mandatory: boolean }

export default function AcknowledgementsPage() {
  const [acks, setAcks] = useState<Ack[]>([]);
  const [unacked, setUnacked] = useState<Policy[]>([]);

  useEffect(() => {
    fetch('/api/policy-acknowledgements').then(r => r.json()).then(d => { setAcks(d.acknowledgements || []); setUnacked(d.unacknowledged || []); });
  }, []);

  const handleAck = async (policyId: number) => {
    const res = await fetch('/api/policy-acknowledgements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policyId }) });
    if (res.ok) {
      const policy = unacked.find(p => p.id === policyId);
      if (policy) {
        setUnacked(unacked.filter(p => p.id !== policyId));
        setAcks([...acks, { id: 0, status: 'Acknowledged', acknowledgedAt: new Date().toISOString(), policy }]);
      }
    }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Policy Acknowledgements</h1><p className="page-subtitle">Review and acknowledge ESG policies</p></div></div>

      {unacked.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-yellow)' }}>⚠ Pending Acknowledgements</h3>
          <div className="card-grid">
            {unacked.map(p => (
              <div key={p.id} className="card" style={{ borderLeftColor: 'var(--accent-yellow)', borderLeftWidth: '3px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>{p.title}</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <span className={`badge ${p.category === 'Environmental' ? 'badge-green' : p.category === 'Social' ? 'badge-blue' : 'badge-purple'}`}>{p.category}</span>
                  {p.mandatory && <span className="badge badge-red">Mandatory</span>}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleAck(p.id)}>✓ Acknowledge</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Acknowledged Policies</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Policy</th><th>Category</th><th>Status</th><th>Acknowledged At</th></tr></thead>
          <tbody>
            {acks.filter(a => a.status === 'Acknowledged').map((a, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.policy.title}</td>
                <td><span className={`badge ${a.policy.category === 'Environmental' ? 'badge-green' : a.policy.category === 'Social' ? 'badge-blue' : 'badge-purple'}`}>{a.policy.category}</span></td>
                <td><span className="badge badge-green">✅ Acknowledged</span></td>
                <td>{a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
