import React, { useMemo } from 'react';
import { format, eachDayOfInterval, subDays, startOfWeek, getDay } from 'date-fns';

export default function CalendarHeatmap({ dailyBreakdown = {}, medalGoals = { bronze: 180, silver: 240, gold: 300 }, weeks = 18 }) {
  const today = new Date();
  const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today });
  }, [startDate, today]);

  // Pad leading empty cells
  const leadingBlanks = getDay(startDate);

  const getColor = (dateStr) => {
    const mins = dailyBreakdown[dateStr]?.minutes || 0;
    if (mins === 0) return 'var(--bg-input)';
    if (mins >= medalGoals.gold) return '#FBBF24';
    if (mins >= medalGoals.silver) return '#94A3B8';
    if (mins >= medalGoals.bronze) return '#CD7C3A';
    // Some study but below bronze
    const opacity = Math.min(0.8, 0.2 + (mins / medalGoals.bronze) * 0.6);
    return `rgba(91,164,207,${opacity})`;
  };

  const getTitle = (dateStr) => {
    const mins = dailyBreakdown[dateStr]?.minutes || 0;
    if (mins === 0) return format(new Date(dateStr + 'T12:00'), 'MMM d') + ': No study';
    const h = Math.floor(mins / 60), m = mins % 60;
    const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
    const medal = mins >= medalGoals.gold ? '🥇' : mins >= medalGoals.silver ? '🥈' : mins >= medalGoals.bronze ? '🥉' : '';
    return `${format(new Date(dateStr + 'T12:00'), 'MMM d')}: ${time} ${medal}`;
  };

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Build month labels
  const monthLabels = [];
  let lastMonth = -1;
  const allCells = Array(leadingBlanks).fill(null).concat(days);
  const numCols = Math.ceil(allCells.length / 7);

  let colIdx = 0;
  for (let col = 0; col < numCols; col++) {
    const dayIdx = col * 7 - leadingBlanks;
    if (dayIdx >= 0 && dayIdx < days.length) {
      const d = days[dayIdx];
      const month = d.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ col, label: format(d, 'MMM') });
        lastMonth = month;
      }
    }
  }

  return (
    <div className="heatmap-wrapper">
      {/* Month labels */}
      <div className="heatmap-months" style={{ gridTemplateColumns: `16px repeat(${numCols}, 12px)` }}>
        <div />
        {Array.from({ length: numCols }, (_, col) => {
          const ml = monthLabels.find(m => m.col === col);
          return <div key={col} className="heatmap-month-label">{ml ? ml.label : ''}</div>;
        })}
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {/* Day labels */}
        <div className="heatmap-day-labels">
          {dayLabels.map((d, i) => (
            <div key={i} className="heatmap-day-label">{i % 2 === 1 ? d : ''}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-grid" style={{ gridTemplateRows: 'repeat(7, 12px)', gridTemplateColumns: `repeat(${numCols}, 12px)` }}>
          {/* Leading blanks */}
          {Array(leadingBlanks).fill(null).map((_, i) => (
            <div key={`blank-${i}`} style={{ gridRow: i + 1 }} />
          ))}
          {/* Day cells */}
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const row = (leadingBlanks + i) % 7;
            const col = Math.floor((leadingBlanks + i) / 7);
            const isToday = dateStr === format(today, 'yyyy-MM-dd');
            return (
              <div
                key={dateStr}
                className={`heatmap-cell ${isToday ? 'today' : ''}`}
                style={{
                  background: getColor(dateStr),
                  gridRow: row + 1,
                  gridColumn: col + 1,
                }}
                title={getTitle(dateStr)}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-label">Less</span>
        {[
          'var(--bg-input)',
          'rgba(91,164,207,0.3)',
          'rgba(91,164,207,0.7)',
          '#CD7C3A',
          '#94A3B8',
          '#FBBF24'
        ].map((c, i) => (
          <div key={i} className="heatmap-cell" style={{ background: c, width: 12, height: 12, borderRadius: 3 }} />
        ))}
        <span className="legend-label">More</span>
        <span className="legend-sep">·</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>🥉{medalGoals.bronze}m</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>🥈{medalGoals.silver}m</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>🥇{medalGoals.gold}m</span>
      </div>
    </div>
  );
}
