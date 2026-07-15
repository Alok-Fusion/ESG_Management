'use client';

import { useState, useEffect } from 'react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalXpEarned: number;
  checkedInToday: boolean;
  recentActions: { id: number; action: string; category: string; checkDate: string; xpEarned: number }[];
}

interface LeaderboardEntry {
  id: number;
  name: string;
  streak: number;
  totalCheckIns: number;
}

interface GreenAction {
  action: string;
  category: string;
}

export default function StreaksPage() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [actions, setActions] = useState<GreenAction[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const loadData = () => {
    fetch('/api/streaks/my-streak').then(r => r.json()).then(setStreakData).catch(() => {});
    fetch('/api/streaks/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
    fetch('/api/streaks/actions').then(r => r.json()).then(setActions).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleCheckIn = async () => {
    if (!selectedAction) return;
    setSubmitting(true);
    try {
      const actionObj = actions.find(a => a.action === selectedAction);
      const res = await fetch('/api/streaks/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selectedAction, category: actionObj?.category || 'General' }),
      });
      if (res.ok) {
        setJustCheckedIn(true);
        setTimeout(() => setJustCheckedIn(false), 3000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const flameEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 1) return '🔥';
    return '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Green Streaks</h1>
          <p className="page-subtitle">Log one green action daily to build your sustainability streak</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Streak Stats */}
        <div className="chart-card" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '72px', fontWeight: 900, lineHeight: 1, color: 'var(--accent-orange)' }}>
            {streakData?.currentStreak || 0}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Day Streak {flameEmoji(streakData?.currentStreak || 0)}
          </div>

          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '28px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{streakData?.longestStreak || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Longest Streak</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{streakData?.totalCheckIns || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Check-Ins</div>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-green)' }}>{streakData?.totalXpEarned || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>XP Earned</div>
            </div>
          </div>
        </div>

        {/* Check-In Card */}
        <div className="chart-card" style={{ padding: '32px' }}>
          <h3>Daily Check-In</h3>
          {streakData?.checkedInToday ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '48px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-green)', marginTop: '8px' }}>
                You've already checked in today!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Come back tomorrow to keep your streak going.
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {justCheckedIn && (
                <div style={{ padding: '10px 16px', background: 'var(--accent-green-dim)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-green)', marginBottom: '16px', textAlign: 'center' }}>
                  +5 XP! Streak updated!
                </div>
              )}
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                What green action did you take today?
              </label>
              <select
                className="form-input"
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value)}
              >
                <option value="">Select an action...</option>
                {actions.map(a => (
                  <option key={a.action} value={a.action}>{a.action}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleCheckIn}
                disabled={submitting || !selectedAction}
                style={{ marginTop: '16px', width: '100%' }}
              >
                {submitting ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        {/* Streak Leaderboard */}
        <div className="chart-card">
          <h3>Streak Leaderboard</h3>
          <table className="data-table" style={{ marginTop: '12px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Streak</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                    {i + 1}
                  </td>
                  <td>{entry.name}</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{entry.streak}</span>
                    <span style={{ marginLeft: '4px' }}>{flameEmoji(entry.streak)}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{entry.totalCheckIns}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No check-ins yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Actions */}
        <div className="chart-card">
          <h3>Your Recent Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {(streakData?.recentActions || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No check-ins yet. Start your streak!</p>
            ) : (
              streakData!.recentActions.map(a => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{a.action}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(a.checkDate).toLocaleDateString()} · {a.category}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>+{a.xpEarned} XP</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
