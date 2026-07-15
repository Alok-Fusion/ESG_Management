'use client';

import { useState, useEffect } from 'react';

interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: string;
  isAnonymous: boolean;
  reporter: { id: number; name: string; email: string } | null;
  status: string;
  resolution: string;
  createdAt: string;
  resolvedAt: string | null;
}

const CATEGORIES = ['Environmental', 'Safety', 'Governance', 'Ethics'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Environmental', severity: 'Medium', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('/api/incidents').then(r => r.json()).then(setIncidents).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: '', description: '', category: 'Environmental', severity: 'Medium', isAnonymous: false });
        const updated = await fetch('/api/incidents').then(r => r.json());
        setIncidents(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const updated = await fetch('/api/incidents').then(r => r.json());
    setIncidents(updated);
  };

  const filtered = filter === 'All' ? incidents : incidents.filter(i => i.status === filter);

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#8b8b9e';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Open': return 'badge-red';
      case 'Investigating': return 'badge-yellow';
      case 'Resolved': return 'badge-green';
      case 'Dismissed': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Reporting</h1>
          <p className="page-subtitle">Report environmental, safety, or governance concerns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Report Incident'}
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <h3>New Incident Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title of the incident"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description of the incident..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Severity</label>
              <select className="form-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="anonymous"
                checked={form.isAnonymous}
                onChange={e => setForm({ ...form, isAnonymous: e.target.checked })}
                style={{ accentColor: 'var(--accent-green)' }}
              />
              <label htmlFor="anonymous" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Submit anonymously (your identity will be hidden from managers)
              </label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Open', 'Investigating', 'Resolved', 'Dismissed'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '5px 12px' }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div className="chart-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No incidents found
          </div>
        ) : (
          filtered.map(inc => (
            <div key={inc.id} className="chart-card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: severityColor(inc.severity),
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{inc.title}</span>
                    <span className={`badge ${statusBadge(inc.status)}`}>{inc.status}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 8px', lineHeight: 1.5 }}>
                    {inc.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Category: {inc.category}</span>
                    <span>Severity: {inc.severity}</span>
                    <span>Reporter: {inc.isAnonymous ? 'Anonymous' : inc.reporter?.name || 'Unknown'}</span>
                    <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {(inc.status === 'Open' || inc.status === 'Investigating') && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {inc.status === 'Open' && (
                      <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => updateStatus(inc.id, 'Investigating')}>
                        Investigate
                      </button>
                    )}
                    <button className="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => updateStatus(inc.id, 'Resolved')}>
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
