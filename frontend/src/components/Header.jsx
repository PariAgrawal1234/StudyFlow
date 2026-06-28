import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import { MdPlayArrow, MdStop, MdPause, MdAdd } from 'react-icons/md';
import { format } from 'date-fns';
import TimerModal from './TimerModal';
import '../styles/Header.css';

export default function Header({ title, subtitle }) {
  const { isRunning, elapsed, formatTimerDisplay, pause, resume } = useTimer();
  const [showTimerModal, setShowTimerModal] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-date">{format(new Date(), 'dd/MM/yy')} · {format(new Date(), 'EEEE')}</div>
          <h1 className="header-title">{title || 'Dashboard'}</h1>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
        <div className="header-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTimerModal(true)}>
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
    </>
  );
}
