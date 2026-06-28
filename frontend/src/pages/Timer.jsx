import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '../context/TimerContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdPlayArrow, MdStop, MdPause, MdHistory, MdFullscreen, MdFullscreenExit, MdKeyboard } from 'react-icons/md';
import { format } from 'date-fns';
import '../styles/Timer.css';

const ACCENT_COLORS = [
  { color: '#A78BFA', name: 'Violet', glow: 'rgba(167,139,250,0.4)' },
  { color: '#818CF8', name: 'Indigo', glow: 'rgba(129,140,248,0.4)' },
  { color: '#60A5FA', name: 'Blue', glow: 'rgba(96,165,250,0.4)' },
  { color: '#22D3EE', name: 'Cyan', glow: 'rgba(34,211,238,0.4)' },
  { color: '#34D399', name: 'Emerald', glow: 'rgba(52,211,153,0.4)' },
  { color: '#FBBF24', name: 'Amber', glow: 'rgba(251,191,36,0.4)' },
  { color: '#FB7185', name: 'Rose', glow: 'rgba(251,113,133,0.4)' },
];

const STYLES = [
  { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg, #1a0533 0%, #0d1b3e 50%, #0a2a1a 100%)' },
  { id: 'midnight', name: 'Midnight Focus', bg: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0a 70%)' },
  { id: 'ocean', name: 'Deep Ocean', bg: 'linear-gradient(180deg, #020b18 0%, #0a2540 100%)' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg, #020f07 0%, #0a1f10 100%)' },
];

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimerPage() {
  const {
    isRunning, elapsed, timerType, setTimerType,
    selectedCourse, setSelectedCourse,
    accentColor, setAccentColor,
    start, pause, resume, stop, formatTimerDisplay,
    registerSocketEmitters
  } = useTimer();
  const { emitTimerStart, emitTimerStop } = useSocket();

  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[1]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const containerRef = useRef(null);

  const accent = ACCENT_COLORS.find(a => a.color === accentColor) || ACCENT_COLORS[0];

  useEffect(() => {
    registerSocketEmitters(emitTimerStart, emitTimerStop);
  }, [emitTimerStart, emitTimerStop]);

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data));
    api.get('/sessions?limit=8').then(r => setSessions(r.data.sessions || []));
  }, []);

  // Keyboard shortcut: Space to pause/resume, Esc to exit fullscreen
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (isRunning) pause();
        else if (elapsed > 0) resume();
      }
      if (e.code === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, elapsed, isFullscreen]);

  const handleStart = async () => {
    await start(selectedCourse?._id, selectedCourse?.name);
    setShowCourseDropdown(false);
  };

  const handleStop = async () => {
    await stop(notes);
    setNotes('');
    setShowNotesInput(false);
    api.get('/sessions?limit=8').then(r => setSessions(r.data.sessions || []));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(f => !f);
    setShowPanel(!isFullscreen ? false : true);
  };

  // Parse timer into parts for big display
  const totalSecs = elapsed;
  const hh = Math.floor(totalSecs / 3600);
  const mm = Math.floor((totalSecs % 3600) / 60);
  const ss = totalSecs % 60;
  const showHours = hh > 0;

  return (
    <div
      ref={containerRef}
      className={`timer-fullpage ${isFullscreen ? 'fullscreen' : ''}`}
      style={{ background: isFullscreen || isRunning ? selectedStyle.bg : 'var(--bg-primary)' }}
    >
      {/* Top bar — only when not running in fullscreen */}
      {!isFullscreen && (
        <div className="timer-topbar">
          <h1 className="timer-page-title">Timer</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="tabs">
              <button className={`tab ${timerType === 'stopwatch' ? 'active' : ''}`} onClick={() => setTimerType('stopwatch')} disabled={isRunning}>Stopwatch</button>
              <button className={`tab ${timerType === 'pomodoro' ? 'active' : ''}`} onClick={() => setTimerType('pomodoro')} disabled={isRunning}>Pomodoro 25m</button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen} title="Fullscreen">
              <MdFullscreen style={{ fontSize: '1.3rem' }} />
            </button>
          </div>
        </div>
      )}

      <div className={`timer-content-wrapper ${isFullscreen ? 'fs-mode' : ''}`}>
        {/* ── MAIN TIMER AREA ── */}
        <div className="timer-center-area">

          {/* Course badge */}
          <div className="timer-course-badge" onClick={() => !isRunning && setShowCourseDropdown(d => !d)}>
            <span
              className="course-badge-pill"
              style={{ background: selectedCourse ? selectedCourse.color + '33' : accent.color + '22', borderColor: selectedCourse ? selectedCourse.color : accent.color, color: selectedCourse ? selectedCourse.color : accent.color, cursor: isRunning ? 'default' : 'pointer' }}
            >
              {selectedCourse ? `${selectedCourse.emoji} ${selectedCourse.name}` : '📖 General Study'}
              {!isRunning && <span style={{ marginLeft: 6, opacity: 0.6 }}>▾</span>}
            </span>

            {showCourseDropdown && !isRunning && (
              <div className="course-dropdown">
                <div className={`course-dropdown-item ${!selectedCourse ? 'active' : ''}`} onClick={() => { setSelectedCourse(null); setShowCourseDropdown(false); }}>
                  📖 General Study
                </div>
                {courses.map(c => (
                  <div key={c._id} className={`course-dropdown-item ${selectedCourse?._id === c._id ? 'active' : ''}`}
                    style={{ borderLeft: `3px solid ${c.color}` }}
                    onClick={() => { setSelectedCourse(c); setShowCourseDropdown(false); }}>
                    {c.emoji} {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Big clock display */}
          <div className="timer-clock" style={{ '--accent': accentColor, '--glow': accent.glow }}>
            {showHours ? (
              <>
                <span className="clock-segment">{String(hh).padStart(2, '0')}</span>
                <span className="clock-colon">:</span>
                <span className="clock-segment">{String(mm).padStart(2, '0')}</span>
                <span className="clock-colon">:</span>
                <span className="clock-segment">{String(ss).padStart(2, '0')}</span>
              </>
            ) : (
              <>
                <span className="clock-segment">{String(mm).padStart(2, '0')}</span>
                <span className="clock-colon" style={{ color: accentColor }}>:</span>
                <span className="clock-segment">{String(ss).padStart(2, '0')}</span>
              </>
            )}
          </div>

          {/* Start time */}
          {isRunning && (
            <div className="timer-meta">
              <span className="timer-dot" style={{ background: accentColor }} />
              Start: {format(new Date(Date.now() - elapsed * 1000), 'HH:mm')}
            </div>
          )}
          {!isRunning && elapsed === 0 && !isFullscreen && (
            <div className="timer-hint">Press <kbd>Space</kbd> after starting · <kbd>Esc</kbd> to exit fullscreen</div>
          )}

          {/* Controls */}
          <div className="timer-controls-row">
            {!isRunning && elapsed === 0 && (
              <button
                className="timer-big-btn start"
                style={{ '--btn-color': accentColor, '--btn-glow': accent.glow }}
                onClick={handleStart}
              >
                <MdPlayArrow /> Start
              </button>
            )}
            {!isRunning && elapsed > 0 && (
              <>
                <button className="timer-big-btn resume" style={{ '--btn-color': '#60A5FA', '--btn-glow': 'rgba(96,165,250,0.3)' }} onClick={resume}>
                  <MdPlayArrow /> Resume
                </button>
                <button
                  className="timer-big-btn save"
                  style={{ '--btn-color': accentColor, '--btn-glow': accent.glow }}
                  onClick={handleStop}
                >
                  ✓ Save session
                </button>
              </>
            )}
            {isRunning && (
              <>
                <button className="timer-big-btn pause" style={{ '--btn-color': '#94A3B8', '--btn-glow': 'rgba(148,163,184,0.2)' }} onClick={pause}>
                  <MdPause /> Pause
                </button>
                <button
                  className="timer-big-btn save"
                  style={{ '--btn-color': accentColor, '--btn-glow': accent.glow }}
                  onClick={handleStop}
                >
                  ✓ Save session
                </button>
              </>
            )}
          </div>

          {/* Notes toggle */}
          {(isRunning || elapsed > 0) && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNotesInput(n => !n)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                <MdKeyboard /> {showNotesInput ? 'Hide notes' : 'Add notes'}
              </button>
              {showNotesInput && (
                <textarea
                  className="timer-notes-input"
                  placeholder="What are you studying?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Variants + Style ── */}
        <div className={`timer-panel ${isFullscreen ? 'panel-overlay' : ''} ${showPanel ? 'visible' : ''}`}>
          <div className="panel-section">
            <div className="panel-label">VARIANT</div>
            <div className="color-grid">
              {ACCENT_COLORS.map(a => (
                <button
                  key={a.color}
                  className={`color-swatch ${accentColor === a.color ? 'selected' : ''}`}
                  style={{ background: a.color }}
                  onClick={() => setAccentColor(a.color)}
                  title={a.name}
                />
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">STYLE</div>
            <div className="style-grid">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  className={`style-card ${selectedStyle.id === s.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStyle(s)}
                >
                  <div className="style-preview" style={{ background: s.bg }} />
                  <span className="style-name">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          {!isFullscreen && (
            <div className="panel-section">
              <div className="panel-label"><MdHistory style={{ verticalAlign: 'middle' }} /> RECENT</div>
              <div className="recent-sessions">
                {sessions.length === 0
                  ? <div className="recent-empty">No sessions yet</div>
                  : sessions.map(s => (
                    <div key={s._id} className="recent-item">
                      <div>
                        <div className="recent-course">{s.courseName}</div>
                        <div className="recent-time-meta">{format(new Date(s.startTime), 'dd/MM HH:mm')}</div>
                      </div>
                      <div className="recent-duration" style={{ color: accentColor }}>{fmtHM(s.duration || 0)}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen controls */}
      {isFullscreen && (
        <div className="fs-bottom-bar">
          <button className="fs-icon-btn" onClick={() => setShowPanel(p => !p)} title="Toggle panel">
            <span style={{ fontSize: '1.1rem' }}>⚙</span>
          </button>
          <button className="fs-icon-btn" onClick={toggleFullscreen} title="Exit fullscreen">
            <MdFullscreenExit style={{ fontSize: '1.3rem' }} />
          </button>
        </div>
      )}

      {/* Fullscreen entry button — shown when not fullscreen */}
      {!isFullscreen && (
        <button className="fullscreen-fab" onClick={toggleFullscreen} title="Enter focus mode">
          <MdFullscreen />
        </button>
      )}
    </div>
  );
}
