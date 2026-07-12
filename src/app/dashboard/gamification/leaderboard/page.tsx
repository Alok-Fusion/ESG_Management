'use client';
import { useState, useEffect } from 'react';

interface Entry { name: string; xp: number; type: string; dept?: string }

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  useEffect(() => { fetch('/api/leaderboard').then(r => r.json()).then(setEntries); }, []);

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Leaderboard</h1><p className="page-subtitle">Top performers by XP — Users & Departments combined</p></div></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Rank</th><th>Name</th><th>Type</th><th>Department</th><th>XP</th></tr></thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td>
                  <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ''}`} style={i >= 3 ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' } : {}}>
                    {i + 1}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{e.name}</td>
                <td><span className={`badge ${e.type === 'user' ? 'badge-blue' : 'badge-orange'}`}>{e.type === 'user' ? '👤 User' : '🏢 Dept'}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{e.dept || '—'}</td>
                <td><span style={{ fontWeight: 800, color: 'var(--accent-orange)', fontSize: '15px' }}>{e.xp.toLocaleString()} XP</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
