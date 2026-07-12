'use client';
import { useState, useEffect } from 'react';

interface Audit { id: number; title: string; date: string; findings: string; status: string; department: { name: string }; auditor: { name: string } }

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [depts, setDepts] = useState<{id:number;name:string}[]>([]);
  const [users, setUsers] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ title: '', departmentId: '', auditorId: '', date: '', findings: '', status: 'UnderReview' });

  useEffect(() => {
    fetch('/api/audits').then(r => r.json()).then(setAudits);
    fetch('/api/departments').then(r => r.json()).then(setDepts);
    fetch('/api/auth/me').then(r => r.json()).then(() => {
      // For simplicity, fetch users from departments
    });
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/audits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const a = await res.json(); setAudits([a, ...audits]); setShowModal(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Audits</h1><p className="page-subtitle">Internal and external audit records</p></div>
        <button className="btn btn-purple" onClick={() => setShowModal(true)}>+ New Audit</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Title</th><th>Department</th><th>Auditor</th><th>Date</th><th>Findings</th><th>Status</th></tr></thead>
          <tbody>
            {audits.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</td>
                <td>{a.department?.name}</td>
                <td>{a.auditor?.name}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.findings}</td>
                <td><span className={`badge ${a.status === 'Completed' ? 'badge-green' : 'badge-yellow'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Audit</h2>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}><option value="">Select...</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Auditor ID</label><input type="number" className="form-input" value={form.auditorId} onChange={e => setForm({...form, auditorId: e.target.value})} placeholder="User ID" /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Findings</label><textarea className="form-textarea" value={form.findings} onChange={e => setForm({...form, findings: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-purple" onClick={handleCreate}>Create Audit</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
