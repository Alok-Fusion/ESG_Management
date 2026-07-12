'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Challenge { id: number; title: string; description: string; xp: number; difficulty: string; deadline: string; status: string; evidenceRequired: boolean; }
const statuses = ['All', 'Draft', 'Active', 'UnderReview', 'Completed', 'Archived'];
const difficultyColors: Record<string, string> = { Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red' };

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', xp: '100', difficulty: 'Medium', deadline: '', evidenceRequired: false, status: 'Draft' });
  const [userRole, setUserRole] = useState<string>('Employee');

  useEffect(() => {
    fetch('/api/challenges').then(r => r.json()).then(setChallenges);
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.role) setUserRole(d.user.role); });
  }, []);

  const filtered = filter === 'All' ? challenges : challenges.filter(c => c.status === filter);

  const handleCreate = async () => {
    const res = await fetch('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const c = await res.json(); setChallenges([c, ...challenges]); setShowModal(false); }
  };

  const handleJoin = async (id: number) => {
    const res = await fetch('/api/challenge-participations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: id }) });
    if (res.ok) alert('Joined successfully!');
    else { const d = await res.json(); alert(d.error); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Challenges</h1><p className="page-subtitle">Sustainability challenges with XP rewards</p></div>
        {userRole !== 'Employee' && (
          <button className="btn btn-orange" onClick={() => setShowModal(true)}>+ New Challenge</button>
        )}
      </div>

      <div className="tab-pills">
        {statuses.map(s => <button key={s} className={`tab-pill ${filter === s ? 'active-orange' : ''}`} onClick={() => setFilter(s)}>{s}</button>)}
      </div>

      <div className="card-grid">
        {filtered.map(c => (
          <div key={c.id} className="card card-orange">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{c.title}</h3>
              <span className={`badge ${c.status === 'Active' ? 'badge-green' : c.status === 'Draft' ? 'badge-gray' : c.status === 'Completed' ? 'badge-blue' : 'badge-yellow'}`}>{c.status}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{c.description}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span className="badge badge-orange">{c.xp} XP</span>
              <span className={`badge ${difficultyColors[c.difficulty] || 'badge-gray'}`}>{c.difficulty}</span>
              <span className="badge badge-gray">Deadline: {new Date(c.deadline).toLocaleDateString()}</span>
              {c.evidenceRequired && <span className="badge badge-yellow">Evidence Required</span>}
            </div>
            <Link href={`/dashboard/gamification/challenges/${c.id}`} className="btn btn-orange btn-sm" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              View Details
            </Link>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Challenge</h2>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group"><label className="form-label">XP Reward</label><input type="number" className="form-input" value={form.xp} onChange={e => setForm({...form, xp: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Difficulty</label><select className="form-select" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`toggle-switch ${form.evidenceRequired ? 'active' : ''}`} onClick={() => setForm({...form, evidenceRequired: !form.evidenceRequired})} />
              <label className="form-label" style={{ margin: 0 }}>Evidence Required</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-orange" onClick={handleCreate}>Create Challenge</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
