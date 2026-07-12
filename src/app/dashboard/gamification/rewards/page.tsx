'use client';
import { useState, useEffect } from 'react';

interface Reward { id: number; name: string; description: string; pointsRequired: number; stock: number }

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch('/api/rewards').then(r => r.json()).then(setRewards); }, []);

  const handleRedeem = async (id: number) => {
    setMsg('');
    const res = await fetch('/api/rewards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewardId: id }) });
    if (res.ok) {
      setMsg('🎉 Reward redeemed successfully!');
      setRewards(rewards.map(r => r.id === id ? { ...r, stock: r.stock - 1 } : r));
    } else {
      const d = await res.json();
      setMsg(`❌ ${d.error || 'Redemption failed'}`);
    }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Rewards</h1><p className="page-subtitle">Redeem your earned points for rewards</p></div></div>
      {msg && <div className="card" style={{ marginBottom: '20px', borderLeftColor: msg.includes('🎉') ? 'var(--accent-green)' : 'var(--accent-red)', borderLeftWidth: '3px' }}><p style={{ margin: 0, fontSize: '14px' }}>{msg}</p></div>}
      <div className="card-grid">
        {rewards.map(r => (
          <div key={r.id} className="card card-orange">
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎁</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{r.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>{r.description}</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <span className="badge badge-orange">🪙 {r.pointsRequired} pts</span>
              <span className={`badge ${r.stock > 0 ? 'badge-green' : 'badge-red'}`}>📦 {r.stock} left</span>
            </div>
            <button className="btn btn-orange btn-sm" onClick={() => handleRedeem(r.id)} disabled={r.stock <= 0}>Redeem</button>
          </div>
        ))}
      </div>
    </div>
  );
}
