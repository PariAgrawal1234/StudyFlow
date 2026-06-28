import React, { useState, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import { MdClose, MdPlayArrow, MdStop } from 'react-icons/md';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TimerModal({ onClose }) {
  const { isRunning, elapsed, timerType, setTimerType, selectedCourse, setSelectedCourse, start, stop, formatTimerDisplay } = useTimer();
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).catch(() => {});
  }, []);

  const handleStart = async () => {
    await start(selectedCourse?._id);
    onClose();
  };

  const handleStop = async () => {
    await stop(notes);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Study Timer</span>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        {!isRunning ? (
          <>
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab ${timerType === 'stopwatch' ? 'active' : ''}`} onClick={() => setTimerType('stopwatch')}>Stopwatch</button>
              <button className={`tab ${timerType === 'pomodoro' ? 'active' : ''}`} onClick={() => setTimerType('pomodoro')}>Pomodoro</button>
            </div>

            <div className="form-group">
              <label>Course (optional)</label>
              <select className="select" value={selectedCourse?._id || ''} onChange={e => {
                const c = courses.find(c => c._id === e.target.value);
                setSelectedCourse(c || null);
              }}>
                <option value="">General Study</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>

            <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={handleStart}>
              <MdPlayArrow /> Start Session
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', fontFamily: 'Courier New, monospace', fontWeight: 800, color: 'var(--accent-green)', margin: '16px 0', letterSpacing: '0.05em' }}>
              {formatTimerDisplay(elapsed)}
            </div>
            {selectedCourse && (
              <div className="badge badge-blue" style={{ marginBottom: 16, justifyContent: 'center' }}>
                {selectedCourse.emoji} {selectedCourse.name}
              </div>
            )}
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Session notes (optional)</label>
              <textarea className="input textarea" rows={3} placeholder="What did you study?" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-danger btn-lg" style={{ width: '100%' }} onClick={handleStop}>
              <MdStop /> End Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
