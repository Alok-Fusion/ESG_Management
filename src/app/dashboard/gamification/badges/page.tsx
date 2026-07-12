'use client';
import { useState, useEffect } from 'react';

interface Badge { id: number; name: string; description: string; icon: string; unlockRuleType: string; unlockThreshold: number }

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlocked, setUnlocked] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/badges').then(r => r.json()).then(d => { setBadges(d.allBadges || []); setUnlocked(d.userBadges || []); });
  }, []);

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Badges</h1><p className="page-subtitle">Your achievement badges collection</p></div></div>
      <div className="card-grid">
        {badges.map(b => {
          const isUnlocked = unlocked.includes(b.id);
          return (
            <div key={b.id} className={`card ${isUnlocked ? 'card-orange' : ''}`} style={{ opacity: isUnlocked ? 1 : 0.5, textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{b.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{b.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>{b.description}</p>
              <span className={`badge ${isUnlocked ? 'badge-green' : 'badge-gray'}`}>
                {isUnlocked ? '✅ Unlocked' : `🔒 ${b.unlockRuleType === 'xp' ? `${b.unlockThreshold} XP` : `${b.unlockThreshold} challenges`}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
