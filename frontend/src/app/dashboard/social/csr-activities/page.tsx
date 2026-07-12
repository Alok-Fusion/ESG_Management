'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Activity { id: number; title: string; icon: string; description: string; joinCount: number; evidenceRequired: boolean; status: string; category?: { name: string } }

export default function CSRActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', icon: '🌱', evidenceRequired: false });
  const [userRole, setUserRole] = useState<string>('Employee');

  useEffect(() => {
    fetch('/api/csr-activities').then(r => r.json()).then(setActivities);
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.role) setUserRole(d.user.role); });
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/csr-activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const a = await res.json(); setActivities([a, ...activities]); setShowModal(false); setForm({ title: '', description: '', icon: '🌱', evidenceRequired: false }); }
  };

  const handleJoin = async (id: number) => {
    const res = await fetch('/api/csr-activities/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activityId: id }) });
    if (res.ok) { setActivities(activities.map(a => a.id === id ? { ...a, joinCount: a.joinCount + 1 } : a)); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">CSR Activities</h1><p className="page-subtitle">Community & social responsibility programs</p></div>
        {userRole !== 'Employee' && (
          <button className="btn btn-blue" onClick={() => setShowModal(true)}>+ New Activity</button>
        )}
      </div>

      <div className="card-grid">
        {activities.map(a => (
          <div key={a.id} className="card card-blue">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>{a.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{a.title}</h3>
                {a.category && <span className="badge badge-blue" style={{ marginTop: '4px' }}>{a.category.name}</span>}
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{a.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span className="badge badge-blue">{a.joinCount} joined</span>
              {a.evidenceRequired && <span className="badge badge-yellow">Evidence Required</span>}
              <span className={`badge ${a.status === 'Open' ? 'badge-green' : 'badge-gray'}`}>{a.status}</span>
            </div>
            <Link href={`/dashboard/social/csr-activities/${a.id}`} className="btn btn-blue btn-sm" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              View Details
            </Link>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New CSR Activity</h2>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Icon (text or symbol)</label><input className="form-input" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`toggle-switch ${form.evidenceRequired ? 'active' : ''}`} onClick={() => setForm({...form, evidenceRequired: !form.evidenceRequired})} />
              <label className="form-label" style={{ margin: 0 }}>Evidence Required</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-blue" onClick={handleCreate}>Create Activity</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
