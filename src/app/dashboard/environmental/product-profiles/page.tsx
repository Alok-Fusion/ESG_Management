'use client';
import { useState, useEffect } from 'react';

interface Profile { id: number; productName: string; carbonFootprint: number; sustainabilityRating: string; notes: string | null }

export default function ProductProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productName: '', carbonFootprint: '', sustainabilityRating: 'A', notes: '' });

  useEffect(() => { fetch('/api/product-profiles').then(r => r.json()).then(setProfiles); }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/product-profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const p = await res.json(); setProfiles([...profiles, p]); setShowModal(false); }
  };

  const ratingColors: Record<string, string> = { 'A+': 'badge-green', 'A': 'badge-green', 'B': 'badge-blue', 'C': 'badge-yellow', 'D': 'badge-orange', 'F': 'badge-red' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Product ESG Profiles</h1><p className="page-subtitle">Sustainability ratings for products</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Profile</button>
      </div>
      <div className="card-grid">
        {profiles.map(p => (
          <div key={p.id} className="card card-green">
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>{p.productName}</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className={`badge ${ratingColors[p.sustainabilityRating] || 'badge-gray'}`}>Rating: {p.sustainabilityRating}</span>
              <span className="badge badge-green">🌿 {p.carbonFootprint} kg CO₂e</span>
            </div>
            {p.notes && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{p.notes}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Product ESG Profile</h2>
            <div className="form-group"><label className="form-label">Product Name</label><input className="form-input" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group"><label className="form-label">Carbon Footprint (kg)</label><input type="number" step="0.1" className="form-input" value={form.carbonFootprint} onChange={e => setForm({...form, carbonFootprint: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Rating</label><select className="form-select" value={form.sustainabilityRating} onChange={e => setForm({...form, sustainabilityRating: e.target.value})}><option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option><option>F</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}><button className="btn btn-primary" onClick={handleCreate}>Create</button><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
