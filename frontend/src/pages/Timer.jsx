import React, { useState, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import Header from '../components/Header';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { MdPlayArrow, MdStop, MdPause, MdHistory } from 'react-icons/md';
import { format } from 'date-fns';
import '../styles/Timer.css';

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimerPage() {
  const { isRunning, elapsed, timerType, setTimerType, selectedCourse, setSelectedCourse, start, pause, resume, stop, formatTimerDisplay } = useTimer();
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data));
    api.get('/sessions?limit=10').then(r => setSessions(r.data.sessions || []));
  }, []);

  const handleStop = async () => {
    await stop(notes);
    setNotes('');
    api.get('/sessions?limit=10').then(r => setSessions(r.data.sessions || []));
  };

  const progress = timerType === 'pomodoro' ? (elapsed / (25 * 60)) * 100 : Math.min(100, (elapsed / (3 * 3600)) * 100);
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div>
      <Header title="Timer" />
      <div className="page">
        <div className="timer-layout">
          <div className="timer-main card">
            <div className="tabs" style={{ marginBottom: 24 }}>
              <button className={`tab ${timerType === 'stopwatch' ? 'active' : ''}`} onClick={() => setTimerType('stopwatch')} disabled={isRunning}>Stopwatch</button>
              <button className={`tab ${timerType === 'pomodoro' ? 'active' : ''}`} onClick={() => setTimerType('pomodoro')} disabled={isRunning}>Pomodoro (25m)</button>
            </div>

            <div className="timer-circle-container">
              <svg className="timer-ring" width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="90" fill="none" stroke="var(--bg-input)" strokeWidth="8" />
                <circle cx="110" cy="110" r="90" fill="none"
                  stroke={isRunning ? '#34D399' : 'var(--accent-primary)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="timer-display-center">
                <div className="timer-time">{formatTimerDisplay(elapsed)}</div>
                {selectedCourse && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedCourse.emoji} {selectedCourse.name}
                  </div>
                )}
              </div>
            </div>

            <div className="timer-controls">
              {!isRunning && elapsed === 0 && (
                <button className="btn btn-success btn-lg timer-start-btn" onClick={() => start(selectedCourse?._id)}>
                  <MdPlayArrow /> Start
                </button>
              )}
              {isRunning && (
                <>
                  <button className="btn btn-secondary btn-lg" onClick={pause}><MdPause /> Pause</button>
                  <button className="btn btn-danger btn-lg" onClick={handleStop}><MdStop /> End Session</button>
                </>
              )}
              {!isRunning && elapsed > 0 && (
                <>
                  <button className="btn btn-primary btn-lg" onClick={resume}><MdPlayArrow /> Resume</button>
                  <button className="btn btn-danger btn-lg" onClick={handleStop}><MdStop /> End</button>
                </>
              )}
            </div>

            {(isRunning || elapsed > 0) && (
              <div style={{ marginTop: 20 }}>
                <label>Session notes</label>
                <textarea className="input" rows={2} placeholder="What are you studying?" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
              </div>
            )}
          </div>

          <div className="timer-sidebar">
            {!isRunning && (
              <div className="card">
                <div className="card-title">Course</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className={`course-option ${!selectedCourse ? 'selected' : ''}`} onClick={() => setSelectedCourse(null)}>
                    📖 General Study
                  </div>
                  {courses.map(c => (
                    <div key={c._id} className={`course-option ${selectedCourse?._id === c._id ? 'selected' : ''}`} onClick={() => setSelectedCourse(c)} style={{ borderLeft: `3px solid ${c.color}` }}>
                      {c.emoji} {c.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title"><MdHistory /> Recent Sessions</div>
              {sessions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>No sessions yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map(s => (
                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.courseName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(s.startTime), 'dd/MM HH:mm')}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{fmtHM(s.duration || 0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
