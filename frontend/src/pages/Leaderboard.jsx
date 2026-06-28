import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { format, subDays } from 'date-fns';

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const medalGoals = user?.settings?.medalGoals || { bronze: 180, silver: 240, gold: 300 };

  useEffect(() => {
    const from = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const to = format(new Date(), 'yyyy-MM-dd');
    api.get(`/sessions/stats?from=${from}&to=${to}`)
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  const dailyMap = stats?.dailyBreakdown || {};
  const days = Object.entries(dailyMap).sort(([a], [b]) => b.localeCompare(a));

  let gold = 0, silver = 0, bronze = 0;
  days.forEach(([, d]) => {
    if (d.minutes >= medalGoals.gold) gold++;
    else if (d.minutes >= medalGoals.silver) silver++;
    else if (d.minutes >= medalGoals.bronze) bronze++;
  });

  return (
    <div>
      <Header title="Medals" />
      <div className="page">
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { emoji: '🥇', label: 'Gold', count: gold, req: `${medalGoals.gold} min`, color: '#FBBF24' },
            { emoji: '🥈', label: 'Silver', count: silver, req: `${medalGoals.silver} min`, color: '#94A3B8' },
            { emoji: '🥉', label: 'Bronze', count: bronze, req: `${medalGoals.bronze} min`, color: '#CD7C3A' },
          ].map(m => (
            <div key={m.label} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>{m.emoji}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: m.color, fontFamily: 'var(--font-display)' }}>{m.count}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>≥ {m.req}/day</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Daily Medal History (Last 30 Days)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {days.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No study days recorded yet</div>
            ) : days.map(([date, d]) => {
              const medal = d.minutes >= medalGoals.gold ? { emoji: '🥇', color: '#FBBF24', label: 'Gold' }
                : d.minutes >= medalGoals.silver ? { emoji: '🥈', color: '#94A3B8', label: 'Silver' }
                : d.minutes >= medalGoals.bronze ? { emoji: '🥉', color: '#CD7C3A', label: 'Bronze' }
                : null;
              const pct = Math.min(100, Math.round((d.minutes / medalGoals.gold) * 100));
              return (
                <div key={date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 80, fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{format(new Date(date + 'T12:00'), 'MMM d, EEE')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: medal ? medal.color : 'var(--border-light)' }} />
                    </div>
                  </div>
                  <div style={{ width: 60, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{fmtHM(d.minutes)}</div>
                  <div style={{ width: 28, textAlign: 'center' }}>{medal ? medal.emoji : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
