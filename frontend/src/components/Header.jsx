import React, { useState, useEffect } from 'react';
import { useTimer } from '../context/TimerContext';
import { MdPlayArrow, MdStop, MdPause, MdAdd } from 'react-icons/md';
import { format } from 'date-fns';
import TimerModal from './TimerModal';
import AddSessionModal from './AddSessionModal';
import api from '../utils/api';
import '../styles/Header.css';

export default function Header({ title, subtitle }) {
  const { isRunning, elapsed, formatTimerDisplay, pause } = useTimer();
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (showAddSessionModal) {
      api.get('/courses').then(r => setCourses(r.data)).catch(() => {});
    }
  }, [showAddSessionModal]);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-date">{format(new Date(), 'dd/MM/yy')} · {format(new Date(), 'EEEE')}</div>
          <h1 className="header-title">{title || 'Dashboard'}</h1>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
        <div className="header-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSessionModal(true)}>
            <MdAdd /> Session
          </button>
          <button
            className={`timer-btn ${isRunning ? 'timer-running' : ''}`}
            onClick={() => isRunning ? pause() : setShowTimerModal(true)}
          >
            {isRunning ? (
              <>
                <MdPause className="timer-icon" />
                <span className="timer-display">{formatTimerDisplay(elapsed)}</span>
              </>
            ) : elapsed > 0 ? (
              <>
                <MdPlayArrow className="timer-icon" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <MdPlayArrow className="timer-icon" />
                <span>Timer</span>
              </>
            )}
          </button>
        </div>
      </header>
      {showTimerModal && <TimerModal onClose={() => setShowTimerModal(false)} />}
      {showAddSessionModal && (
        <AddSessionModal
          courses={courses}
          onSave={() => setShowAddSessionModal(false)}
          onClose={() => setShowAddSessionModal(false)}
        />
      )}
    </>
  );
}