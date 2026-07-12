'use client';
import { useState, useEffect } from 'react';

interface Policy { id: number; title: string; description: string; category: string; version: string; mandatory: boolean }

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Environmental', version: '1.0', mandatory: false });

  useEffect(() => { fetch('/api/policies').then(r => r.json()).then(setPolicies); }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const p = await res.json(); setPolicies([p, ...policies]); setShowModal(false); setForm({ title: '', description: '', category: 'Environmental', version: '1.0', mandatory: false }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this policy?')) return;
    const res = await fetch(`/api/policies?id=${id}`, { method: 'DELETE' });
    if (res.ok) setPolicies(policies.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Policies</h1><p className="page-subtitle">ESG policies and guidelines</p></div>
        <button className="btn btn-purple" onClick={() => setShowModal(true)}>+ New Policy</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Title</th><th>Category</th><th>Version</th><th>Mandatory</th><th>Actions</th></tr></thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id}>
                <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.description.substring(0, 80)}...</div></td>
                <td><span className={`badge ${p.category === 'Environmental' ? 'badge-green' : p.category === 'Social' ? 'badge-blue' : 'badge-purple'}`}>{p.category}</span></td>
                <td>v{p.version}</td>
                <td>{p.mandatory ? <span className="badge badge-red">Required</span> : <span className="badge badge-gray">Optional</span>}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Policy</h2>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>Environmental</option><option>Social</option><option>Governance</option></select></div>
              <div className="form-group"><label className="form-label">Version</label><input className="form-input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} /></div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`toggle-switch ${form.mandatory ? 'active' : ''}`} onClick={() => setForm({...form, mandatory: !form.mandatory})} />
              <label className="form-label" style={{ margin: 0 }}>Mandatory</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-purple" onClick={handleCreate}>Create Policy</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
