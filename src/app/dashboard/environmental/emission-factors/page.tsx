'use client';
import { useState, useEffect } from 'react';

interface EF { id: number; activityType: string; factorValue: number; unit: string }

export default function EmissionFactorsPage() {
  const [factors, setFactors] = useState<EF[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ activityType: '', factorValue: '', unit: '' });

  useEffect(() => { fetch('/api/emission-factors').then(r => r.json()).then(setFactors); }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/emission-factors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const f = await res.json(); setFactors([...factors, f]); setShowModal(false); setForm({ activityType: '', factorValue: '', unit: '' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this factor?')) return;
    await fetch(`/api/emission-factors?id=${id}`, { method: 'DELETE' });
    setFactors(factors.filter(f => f.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Emission Factors</h1><p className="page-subtitle">CO₂e conversion factors for different activities</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Factor</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Activity Type</th><th>Factor Value</th><th>Unit</th><th>Actions</th></tr></thead>
          <tbody>
            {factors.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.activityType}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{f.factorValue}</span> kg CO₂e</td>
                <td>per {f.unit}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Emission Factor</h2>
            <div className="form-group"><label className="form-label">Activity Type</label><input className="form-input" value={form.activityType} onChange={e => setForm({...form, activityType: e.target.value})} placeholder="e.g. Electricity, Diesel" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Factor Value (kg CO₂e)</label><input type="number" step="0.01" className="form-input" value={form.factorValue} onChange={e => setForm({...form, factorValue: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="kWh, liter, km" /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleCreate}>Create Factor</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
