import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend);

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2540', titleColor: '#E2E8F0', bodyColor: '#94A3B8', borderColor: '#243047', borderWidth: 1 } },
  scales: {
    x: { grid: { color: 'rgba(36,48,71,0.6)' }, ticks: { color: '#64748B', font: { size: 11 } } },
    y: { grid: { color: 'rgba(36,48,71,0.6)' }, ticks: { color: '#64748B', font: { size: 11 } } }
  }
};

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('weeks');
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const from90 = format(subDays(now, 90), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  useEffect(() => {
    api.get(`/sessions/stats?from=${from90}&to=${today}`)
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading stats...</div>;
  if (!stats) return null;

  const { dailyBreakdown, weeklyBreakdown, courseBreakdown, dayOfWeekAvg, totalMinutes, totalSessions } = stats;

  // Last 30 days daily
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(now, i), 'yyyy-MM-dd');
    last30.push({ date: d, minutes: dailyBreakdown[d]?.minutes || 0 });
  }

  const dailyChartData = {
    labels: last30.map(d => format(new Date(d.date + 'T12:00'), 'MMM d')),
    datasets: [{
      data: last30.map(d => Math.round(d.minutes / 60 * 10) / 10),
      borderColor: '#5BA4CF', backgroundColor: 'rgba(91,164,207,0.15)',
      borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#5BA4CF', tension: 0.3, fill: true
    }]
  };

  const weeks = Object.entries(weeklyBreakdown).slice(-8);
  const weeklyChartData = {
    labels: weeks.map(([k]) => k),
    datasets: [{
      data: weeks.map(([, v]) => Math.round(v.minutes / 60 * 10) / 10),
      backgroundColor: 'rgba(91,164,207,0.7)', borderRadius: 6, borderSkipped: false
    }]
  };

  const courses = Object.entries(courseBreakdown);
  const courseColors = ['#5BA4CF','#34D399','#A78BFA','#FBBF24','#FB7185','#2DD4BF'];
  const courseDoughnut = {
    labels: courses.map(([k]) => k),
    datasets: [{
      data: courses.map(([, v]) => v.minutes),
      backgroundColor: courseColors.slice(0, courses.length),
      borderColor: '#1a2540', borderWidth: 3
    }]
  };

  const dowLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const radarData = {
    labels: dowLabels,
    datasets: [{
      data: dayOfWeekAvg.map(d => Math.round(d.avgMinutes / 60 * 10) / 10),
      backgroundColor: 'rgba(91,164,207,0.15)', borderColor: '#5BA4CF', borderWidth: 2,
      pointBackgroundColor: '#5BA4CF', pointRadius: 4
    }]
  };

  return (
    <div>
      <Header title="Statistics" />
      <div className="page">
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Total Study Time', val: fmtHM(totalMinutes) },
            { label: 'Total Sessions', val: totalSessions },
            { label: 'Avg per Session', val: totalSessions ? fmtHM(Math.round(totalMinutes / totalSessions)) : '0m' },
            { label: 'Study Days', val: Object.keys(dailyBreakdown).length }
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)' }}>{s.val}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              Study Time
              <div className="tabs" style={{ marginLeft: 'auto' }}>
                <button className={`tab ${view === 'days' ? 'active' : ''}`} onClick={() => setView('days')}>Days</button>
                <button className={`tab ${view === 'weeks' ? 'active' : ''}`} onClick={() => setView('weeks')}>Weeks</button>
              </div>
            </div>
            <div style={{ height: 220 }}>
              {view === 'days'
                ? <Line data={dailyChartData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, tooltip: { ...chartOpts.plugins.tooltip, callbacks: { label: ctx => `${ctx.raw}h` } } } }} />
                : <Bar data={weeklyChartData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, tooltip: { ...chartOpts.plugins.tooltip, callbacks: { label: ctx => `${ctx.raw}h` } } } }} />
              }
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Study Pattern by Day</div>
            <div style={{ height: 250 }}>
              <Radar data={radarData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2540', titleColor: '#E2E8F0', bodyColor: '#94A3B8' } },
                scales: { r: { grid: { color: 'rgba(36,48,71,0.8)' }, ticks: { color: '#64748B', font: { size: 10 }, backdropColor: 'transparent' }, pointLabels: { color: '#94A3B8', font: { size: 12 } }, angleLines: { color: 'rgba(36,48,71,0.8)' } } }
              }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {dayOfWeekAvg.map(d => (
                <div key={d.day} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-bright)' }}>{fmtHM(d.avgMinutes)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{dowLabels[d.day]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Time by Course</div>
            {courses.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <Doughnut data={courseDoughnut} options={{
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2540', titleColor: '#E2E8F0', bodyColor: '#94A3B8', callbacks: { label: ctx => `${ctx.label}: ${fmtHM(ctx.raw)}` } } }
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {courses.map(([name, data], i) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: courseColors[i % courseColors.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fmtHM(data.minutes)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state"><div className="empty-title">No data yet</div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
