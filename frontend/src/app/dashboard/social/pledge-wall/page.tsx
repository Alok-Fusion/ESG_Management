'use client';

import { useState, useEffect } from 'react';

interface Pledge {
  id: number;
  pledge: string;
  durationDays: number;
  status: string;
  createdAt: string;
  user: { id: number; name: string };
  endorsements: { id: number; user: { id: number; name: string }; createdAt: string }[];
}

export default function PledgeWallPage() {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pledgeText, setPledgeText] = useState('');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const loadPledges = () => {
    fetch('/api/pledges').then(r => r.json()).then(setPledges).catch(() => {});
  };

  useEffect(() => { loadPledges(); }, []);

  const handleCreate = async () => {
    if (!pledgeText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pledge: pledgeText, durationDays: duration }),
      });
      if (res.ok) {
        setPledgeText('');
        setShowForm(false);
        loadPledges();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndorse = async (pledgeId: number) => {
    try {
      await fetch(`/api/pledges/${pledgeId}/endorse`, { method: 'POST' });
      loadPledges();
    } catch (err) {
      console.error(err);
    }
  };

  const pledgeColors = [
    'linear-gradient(135deg, #22c55e22, #3b82f622)',
    'linear-gradient(135deg, #8b5cf622, #ec489922)',
    'linear-gradient(135deg, #f9731622, #eab30822)',
    'linear-gradient(135deg, #06b6d422, #22c55e22)',
    'linear-gradient(135deg, #3b82f622, #8b5cf622)',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sustainability Pledge Wall</h1>
          <p className="page-subtitle">Make and support sustainability commitments across the organization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Make a Pledge'}
        </button>
      </div>

      {/* Create Pledge */}
      {showForm && (
        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <h3>Your Pledge</h3>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>What do you pledge to do?</label>
              <textarea
                className="form-input"
                rows={3}
                value={pledgeText}
                onChange={e => setPledgeText(e.target.value)}
                placeholder="e.g., I pledge to go paperless for 30 days..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Duration: {duration} days</label>
              <input
                type="range"
                min={7}
                max={365}
                step={7}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-green)' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !pledgeText.trim()}>
              {submitting ? 'Publishing...' : 'Publish Pledge'}
            </button>
          </div>
        </div>
      )}

      {/* Pledge Wall */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '18px',
      }}>
        {pledges.length === 0 ? (
          <div className="chart-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No pledges yet. Be the first to make a sustainability commitment!
          </div>
        ) : (
          pledges.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: pledgeColors[i % pledgeColors.length],
                borderRadius: '14px',
                padding: '22px',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', color: '#000', flexShrink: 0,
                }}>
                  {p.user.name.charAt(0)}
                </div>
                <span className={`badge ${p.status === 'Active' ? 'badge-green' : p.status === 'Completed' ? 'badge-blue' : 'badge-gray'}`}>
                  {p.status}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(p.createdAt).toLocaleDateString()} · {p.durationDays} days
                </div>
              </div>

              <p style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                fontStyle: 'italic',
                margin: 0,
              }}>
                "{p.pledge}"
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {p.endorsements.length > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {p.endorsements.length} endorsement{p.endorsements.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 12px' }}
                  onClick={() => handleEndorse(p.id)}
                >
                  Endorse
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
