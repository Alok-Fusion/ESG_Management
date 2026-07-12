'use client';
import { useState, useEffect } from 'react';

interface Issue { id: number; title: string; severity: string; status: string; dueDate: string; isOverdue: boolean; department: { name: string }; owner: { name: string } }

export default function CompliancePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [depts, setDepts] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ title: '', severity: 'Medium', departmentId: '', ownerId: '', dueDate: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/compliance-issues').then(r => r.json()).then(setIssues);
    fetch('/api/departments').then(r => r.json()).then(setDepts);
  }, []);

  const handleCreate = async () => {
    setError('');
    const res = await fetch('/api/compliance-issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const i = await res.json(); setIssues([{ ...i, isOverdue: false, department: depts.find(d => d.id === parseInt(form.departmentId)) || { name: '' }, owner: { name: '' } }, ...issues]); setShowModal(false); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleResolve = async (id: number) => {
    const res = await fetch('/api/compliance-issues', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'Resolved' }) });
    if (res.ok) setIssues(issues.map(i => i.id === id ? { ...i, status: 'Resolved', isOverdue: false } : i));
  };

  const severityColors: Record<string, string> = { Low: 'badge-green', Medium: 'badge-yellow', High: 'badge-orange', Critical: 'badge-red' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Compliance Issues</h1><p className="page-subtitle">Track and resolve compliance issues</p></div>
        <button className="btn btn-purple" onClick={() => setShowModal(true)}>+ New Issue</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Issue</th><th>Severity</th><th>Department</th><th>Owner</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {issues.map(i => (
              <tr key={i.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.title}</td>
                <td><span className={`badge ${severityColors[i.severity] || 'badge-gray'}`}>{i.severity}</span></td>
                <td>{i.department?.name}</td>
                <td>{i.owner?.name}</td>
                <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`badge ${i.status === 'Resolved' ? 'badge-green' : 'badge-yellow'}`}>{i.status}</span>
                    {i.isOverdue && <span className="badge badge-red">⚠ OVERDUE</span>}
                  </div>
                </td>
                <td>
                  {i.status === 'Open' && <button className="btn btn-primary btn-sm" onClick={() => handleResolve(i.id)}>Resolve</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Compliance Issue</h2>
            {error && <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Severity</label><select className="form-select" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
            <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}><option value="">Select...</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Owner (User ID) *</label><input type="number" className="form-input" value={form.ownerId} onChange={e => setForm({...form, ownerId: e.target.value})} placeholder="Required" /></div>
            <div className="form-group"><label className="form-label">Due Date *</label><input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-purple" onClick={handleCreate}>Create Issue</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
