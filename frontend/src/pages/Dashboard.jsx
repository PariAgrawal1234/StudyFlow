import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js';
import { format, subDays } from 'date-fns';
import { MdTrendingUp, MdAccessTime, MdBook, MdLocalFireDepartment, MdEmojiEvents, MdFlag, MdHistory } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2540', titleColor: '#E2E8F0', bodyColor: '#94A3B8', borderColor: '#243047', borderWidth: 1 } },
  scales: {
    x: { grid: { color: 'rgba(36,48,71,0.6)' }, ticks: { color: '#64748B', font: { size: 11 } } },
    y: { grid: { color: 'rgba(36,48,71,0.6)' }, ticks: { color: '#64748B', font: { size: 11 } } }
  }
};

function fmtHM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const from180 = format(subDays(new Date(), 180), 'yyyy-MM-dd');
    Promise.all([
      api.get('/dashboard'),
      api.get(`/sessions/stats?from=${from180}`)
    ]).then(([d, s]) => {
      setData(d.data);
      setStatsData(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 12 }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading dashboard...</span>
    </div>
  );

  const { today, week, month, total, streak, last7Days, goalProgress, medals, courses, sharePriceData } = data || {};

  const shareChartData = {
    labels: sharePriceData?.map(d => format(new Date(d.date), 'MMM d')) || [],
    datasets: [{
      data: sharePriceData?.map(d => d.value) || [],
      borderColor: '#5BA4CF',
      backgroundColor: 'rgba(91,164,207,0.08)',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: true
    }]
  };

  const weeklyChartData = statsData && Object.keys(statsData.weeklyBreakdown || {}).length ? {
    labels: Object.keys(statsData.weeklyBreakdown).slice(-6),
    datasets: [{
      data: Object.values(statsData.weeklyBreakdown).slice(-6).map(w => Math.round(w.minutes / 60 * 10) / 10),
      backgroundColor: 'rgba(91,164,207,0.7)',
      borderRadius: 6,
      borderSkipped: false
    }]
  } : null;

  const radarData = statsData?.dayOfWeekAvg && {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      data: statsData.dayOfWeekAvg.map(d => Math.round(d.avgMinutes / 60 * 10) / 10),
      backgroundColor: 'rgba(91,164,207,0.15)',
      borderColor: '#5BA4CF',
      borderWidth: 2,
      pointBackgroundColor: '#5BA4CF',
      pointRadius: 4
    }]
  };

  const todayMedalColor = { gold: '#FBBF24', silver: '#94A3B8', bronze: '#CD7C3A' };

  return (
    <div>
      <Header title="Dashboard" subtitle={goalProgress ? `${goalProgress.goal.title}` : 'Track your learning journey'} />
      <div className="page">
        {/* Stats row */}
        <div className="dash-stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(91,164,207,0.15)', color: 'var(--accent-primary)' }}><MdAccessTime /></div>
            <div className="stat-body">
              <div className="stat-label">Today</div>
              <div className="stat-value">{fmtHM(today?.minutes || 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)' }}><MdTrendingUp /></div>
            <div className="stat-body">
              <div className="stat-label">This Week</div>
              <div className="stat-value">{fmtHM(week?.minutes || 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--accent-lavender)' }}><MdBook /></div>
            <div className="stat-body">
              <div className="stat-label">This Month</div>
              <div className="stat-value">{fmtHM(month?.minutes || 0)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)' }}><MdLocalFireDepartment /></div>
            <div className="stat-body">
              <div className="stat-label">Streak</div>
              <div className="stat-value">{streak || 0} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>days</span></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(45,212,191,0.15)', color: 'var(--accent-teal)' }}><MdEmojiEvents /></div>
            <div className="stat-body">
              <div className="stat-label">Total Sessions</div>
              <div className="stat-value">{total?.sessions || 0}</div>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          {/* Left: Streaks + Share Price */}
          <div className="dash-col-left">
            {/* Weekly Streaks */}
            <div className="card">
              <div className="card-title"><MdLocalFireDepartment /> Streaks</div>
              <div className="streak-row">
                {last7Days?.map((d, i) => (
                  <div key={i} className="streak-day">
                    <div className={`streak-dot ${d.hasStudied ? 'studied' : 'missed'}`}>
                      {d.hasStudied ? '✓' : d.date === format(new Date(), 'yyyy-MM-dd') ? '?' : '✗'}
                    </div>
                    <div className="streak-day-label">{format(new Date(d.date + 'T12:00:00'), 'EEE').slice(0,2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Price chart */}
            <div className="card">
              <div className="card-title">
                <MdTrendingUp /> Study Progress
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 days</span>
              </div>
              <div style={{ height: 140 }}>
                <Line data={shareChartData} options={{ ...chartDefaults, scales: { x: { display: false }, y: { display: false } } }} />
              </div>
            </div>

            {/* Medals */}
            <div className="card">
              <div className="card-title"><MdEmojiEvents /> Medals (Last 30 days)</div>
              <div className="medals-row">
                <div className="medal-item">
                  <span style={{ fontSize: '1.6rem' }}>🥇</span>
                  <span className="medal-count">{medals?.gold || 0}</span>
                  <span className="medal-label">Gold</span>
                </div>
                <div className="medal-item">
                  <span style={{ fontSize: '1.6rem' }}>🥈</span>
                  <span className="medal-count">{medals?.silver || 0}</span>
                  <span className="medal-label">Silver</span>
                </div>
                <div className="medal-item">
                  <span style={{ fontSize: '1.6rem' }}>🥉</span>
                  <span className="medal-count">{medals?.bronze || 0}</span>
                  <span className="medal-label">Bronze</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Goals */}
          <div className="dash-col-center">
            {goalProgress ? (
              <div className="card goal-card">
                <div className="card-title"><MdFlag /> Active Goal</div>
                <div className="goal-name">{goalProgress.goal.title}</div>
                <div className="goal-dates">
                  {format(new Date(goalProgress.goal.startDate), 'dd/MM/yy')} – {format(new Date(goalProgress.goal.endDate), 'dd/MM/yy')}
                </div>
                <div className="goal-stats-grid">
                  <div className="goal-stat">
                    <div className="goal-stat-value">{fmtHM(goalProgress.studiedMinutes)}</div>
                    <div className="goal-stat-label">Studied</div>
                  </div>
                  <div className="goal-stat">
                    <div className="goal-stat-value">{goalProgress.goal.targetHours}h</div>
                    <div className="goal-stat-label">Goal</div>
                  </div>
                  <div className="goal-stat">
                    <div className="goal-stat-value">{goalProgress.totalSessions}</div>
                    <div className="goal-stat-label">Sessions</div>
                  </div>
                </div>
                <div style={{ margin: '16px 0 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Study Progress: {goalProgress.studyProgressPercent}%</span>
                    <span>Time: {goalProgress.timeElapsedPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill progress-fill-blue" style={{ width: `${goalProgress.studyProgressPercent}%` }} />
                  </div>
                </div>
                <div className="goal-pace-row">
                  <div className="pace-item">
                    <div className="pace-val">{fmtHM(goalProgress.currentPaceMinPerDay)}/day</div>
                    <div className="pace-label">Current pace</div>
                  </div>
                  <div className="pace-item highlight">
                    <div className="pace-val">{fmtHM(goalProgress.requiredPaceMinPerDay)}/day</div>
                    <div className="pace-label">Required pace</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  📅 {goalProgress.daysPassed} / {goalProgress.daysTotal} days passed · {goalProgress.studyDays} active days · {goalProgress.daysRemaining} days remaining
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <MdFlag style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No active goal. Set one to track your progress!</p>
                <a href="/goals" className="btn btn-primary">Create Goal</a>
              </div>
            )}

            {/* Courses */}
            {courses?.length > 0 && (
              <div className="card">
                <div className="card-title"><MdBook /> Courses</div>
                <div className="courses-list">
                  {courses.map(c => (
                    <div key={c._id} className="course-row">
                      <span className="course-emoji">{c.emoji}</span>
                      <div className="course-info">
                        <div className="course-name">{c.name}</div>
                        <div className="progress-bar" style={{ height: 4, marginTop: 4 }}>
                          <div className="progress-fill" style={{ width: `${Math.min(100, c.progressPercent || 0)}%`, background: c.color }} />
                        </div>
                      </div>
                      <div className="course-time">{fmtHM(c.studiedMinutes || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Weekly study + Radar */}
          <div className="dash-col-right">
            {weeklyChartData && (
              <div className="card">
                <div className="card-title">Study Time (Weekly)</div>
                <div style={{ height: 180 }}>
                  <Bar data={weeklyChartData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: (ctx) => `${ctx.raw}h` } } } }} />
                </div>
              </div>
            )}

            {radarData && (
              <div className="card">
                <div className="card-title">Study Pattern</div>
                <div style={{ height: 220 }}>
                  <Radar data={radarData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2540', titleColor: '#E2E8F0', bodyColor: '#94A3B8' } },
                    scales: { r: { grid: { color: 'rgba(36,48,71,0.8)' }, ticks: { color: '#64748B', font: { size: 10 }, backdropColor: 'transparent' }, pointLabels: { color: '#94A3B8', font: { size: 11 } }, angleLines: { color: 'rgba(36,48,71,0.8)' } } }
                  }} />
                </div>
              </div>
            )}

            {/* Study Days */}
            {goalProgress && (
              <div className="card">
                <div className="card-title">Study Days · {goalProgress.studyDays} / {goalProgress.daysTotal}</div>
                <div className="study-days-status" style={{ color: goalProgress.studyProgressPercent < goalProgress.timeElapsedPercent ? 'var(--danger)' : 'var(--accent-green)' }}>
                  {goalProgress.studyProgressPercent < goalProgress.timeElapsedPercent ? '⚠ Behind goal' : '✓ On track'}
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{goalProgress.studyProgressPercent}%</span>
                </div>
                <div className="pace-cards">
                  <div className="pace-card"><div className="pace-card-val">{fmtHM(goalProgress.currentPaceMinPerDay)}</div><div className="pace-card-label">per day</div></div>
                  <div className="pace-card required"><div className="pace-card-val">{fmtHM(goalProgress.requiredPaceMinPerDay)}</div><div className="pace-card-label">required</div></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Heatmap */}
        {statsData && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>
              <MdHistory /> Activity Calendar
              <a href="/sessions" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>View all sessions →</a>
            </div>
            <CalendarHeatmap
              dailyBreakdown={statsData.dailyBreakdown}
              medalGoals={user?.settings?.medalGoals || { bronze: 180, silver: 240, gold: 300 }}
              weeks={18}
            />
          </div>
        )}
      </div>
    </div>
  );
}