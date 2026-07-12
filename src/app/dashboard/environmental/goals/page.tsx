'use client';
import { useState, useEffect } from 'react';

interface Goal { id: number; name: string; targetCO2: number; currentCO2: number; deadline: string; status: string; department: { name: string } }

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [depts, setDepts] = useState<{id:number;name:string}[]>([]);
  const [form, setForm] = useState({ name: '', departmentId: '', targetCO2: '', currentCO2: '0', deadline: '', status: 'Active' });

  useEffect(() => {
    fetch('/api/environmental-goals').then(r => r.json()).then(setGoals);
    fetch('/api/departments').then(r => r.json()).then(setDepts);
  }, []);

  const filtered = goals.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    const res = await fetch('/api/environmental-goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const g = await res.json(); setGoals([g, ...goals]); setShowModal(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    await fetch(`/api/environmental-goals?id=${id}`, { method: 'DELETE' });
    setGoals(goals.filter(g => g.id !== id));
  };

  const exportCSV = () => {
    const header = 'Name,Department,Target CO2,Current CO2,Progress %,Deadline,Status\n';
    const rows = goals.map(g => {
      const progress = g.targetCO2 > 0 ? Math.round((1 - g.currentCO2 / g.targetCO2) * 100) : 0;
      return `"${g.name}","${g.department?.name}",${g.targetCO2},${g.currentCO2},${progress}%,${g.deadline},${g.status}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'environmental_goals.csv'; a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Environmental Goals</h1><p className="page-subtitle">Track CO₂ reduction targets and progress</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="search-input" placeholder="🔍 Search goals..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={exportCSV}>📥 Export CSV</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Goal</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Department</th><th>Target CO₂</th><th>Current CO₂</th><th>Progress</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(g => {
              const progress = g.targetCO2 > 0 ? Math.round((1 - g.currentCO2 / g.targetCO2) * 100) : 0;
              return (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</td>
                  <td>{g.department?.name}</td>
                  <td>{g.targetCO2}t</td>
                  <td>{g.currentCO2}t</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar" style={{ width: '100px' }}><div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: progress >= 80 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{progress}%</span>
                    </div>
                  </td>
                  <td>{new Date(g.deadline).toLocaleDateString()}</td>
                  <td><span className={`badge ${g.status === 'Completed' ? 'badge-green' : g.status === 'On Track' ? 'badge-blue' : 'badge-yellow'}`}>{g.status}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>🗑</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Environmental Goal</h2>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}><option value="">Select...</option>{depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Target CO₂ (tons)</label><input type="number" className="form-input" value={form.targetCO2} onChange={e => setForm({...form, targetCO2: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Current CO₂ (tons)</label><input type="number" className="form-input" value={form.currentCO2} onChange={e => setForm({...form, currentCO2: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleCreate}>Create Goal</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
