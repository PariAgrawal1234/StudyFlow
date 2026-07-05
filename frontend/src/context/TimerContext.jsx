import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TimerContext = createContext(null);

const DEFAULT_POMODORO_SETTINGS = {
  sessionMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4
};

export const TimerProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);

  const wallStartRef = useRef(null);
  const accumulatedSecsRef = useRef(0);

  const [elapsed, setElapsed] = useState(0);

  const [timerType, setTimerType] = useState('stopwatch');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null); // absolute Date of first Start click
  const [accentColor, setAccentColor] = useState('#A78BFA');

  // Pomodoro
  const [pomodoroSettings, setPomodoroSettings] = useState(DEFAULT_POMODORO_SETTINGS);
  const [pomodoroPhase, setPomodoroPhase] = useState('focus');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  // Wall-clock for each pomodoro phase
  const phaseStartRef = useRef(null);    // when current phase started (wall clock)
  const phaseTotalSecsRef = useRef(DEFAULT_POMODORO_SETTINGS.sessionMinutes * 60); // total duration of phase
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(DEFAULT_POMODORO_SETTINGS.sessionMinutes * 60);

  const intervalRef = useRef(null);
  const socketEmitRef = useRef({ start: null, stop: null });
  const pomodoroPhaseRef = useRef('focus'); // ref mirror so interval can read it without stale closure
  const pomodoroCountRef = useRef(0);
  const pomodoroSettingsRef = useRef(DEFAULT_POMODORO_SETTINGS);

  // Keep refs in sync with state
  useEffect(() => { pomodoroPhaseRef.current = pomodoroPhase; }, [pomodoroPhase]);
  useEffect(() => { pomodoroCountRef.current = pomodoroCount; }, [pomodoroCount]);
  useEffect(() => { pomodoroSettingsRef.current = pomodoroSettings; }, [pomodoroSettings]);

  const registerSocketEmitters = (emitStart, emitStop) => {
    socketEmitRef.current = { start: emitStart, stop: emitStop };
  };

  const getPhaseDuration = (phase, settings) => {
    if (phase === 'break') return settings.breakMinutes * 60;
    if (phase === 'longBreak') return settings.longBreakMinutes * 60;
    return settings.sessionMinutes * 60;
  };

  // ── THE KEY FIX: compute elapsed from wall clock, never accumulate ──
  const getElapsed = useCallback(() => {
    if (wallStartRef.current) {
      return accumulatedSecsRef.current + Math.floor((Date.now() - wallStartRef.current) / 1000);
    }
    return accumulatedSecsRef.current;
  }, []);

  const getPhaseSecondsLeft = useCallback(() => {
    if (!phaseStartRef.current) return phaseTotalSecsRef.current;
    const elapsed = Math.floor((Date.now() - phaseStartRef.current) / 1000);
    return Math.max(0, phaseTotalSecsRef.current - elapsed);
  }, []);

  // Main tick — just triggers re-render, actual values computed from wall clock
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const nowElapsed = getElapsed();
        setElapsed(nowElapsed);

        if (timerType === 'pomodoro') {
          const left = getPhaseSecondsLeft();
          setPhaseSecondsLeft(left);

          if (left <= 0) {
            handlePhaseComplete();
          }
        }
      }, 500); // tick every 500ms so display feels responsive even if one tick is late
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timerType]);

  const handlePhaseComplete = useCallback(() => {
    const currentPhase = pomodoroPhaseRef.current;
    const settings = pomodoroSettingsRef.current;
    let nextPhase;

    if (currentPhase === 'focus') {
      const newCount = pomodoroCountRef.current + 1;
      pomodoroCountRef.current = newCount;
      setPomodoroCount(newCount);
      const isLongBreak = newCount % settings.sessionsBeforeLongBreak === 0;
      nextPhase = isLongBreak ? 'longBreak' : 'break';
      toast.success('🎉 Focus complete! Take a break.', { duration: 4000 });
    } else {
      nextPhase = 'focus';
      toast.success('☕ Break over! Back to focus.', { duration: 4000 });
    }

    const nextDuration = getPhaseDuration(nextPhase, settings);
    phaseTotalSecsRef.current = nextDuration;
    phaseStartRef.current = Date.now();
    pomodoroPhaseRef.current = nextPhase;
    setPomodoroPhase(nextPhase);
    setPhaseSecondsLeft(nextDuration);
  }, []);

  const start = useCallback(async (courseId, courseName) => {
    try {
      const res = await api.post('/sessions/start', { courseId, timerType });
      const now = Date.now();

      setSessionId(res.data._id);
      setStartTime(new Date(now));
      wallStartRef.current = now;
      accumulatedSecsRef.current = 0;
      setElapsed(0);
      setIsRunning(true);

      if (timerType === 'pomodoro') {
        const dur = getPhaseDuration('focus', pomodoroSettings);
        phaseStartRef.current = now;
        phaseTotalSecsRef.current = dur;
        setPomodoroPhase('focus');
        setPomodoroCount(0);
        pomodoroPhaseRef.current = 'focus';
        pomodoroCountRef.current = 0;
        setPhaseSecondsLeft(dur);
      }

      socketEmitRef.current.start?.(courseName || 'General Study');
      toast.success('Session started!');
    } catch (err) {
      toast.error('Failed to start session');
    }
  }, [timerType, pomodoroSettings]);

  const pause = useCallback(() => {
    // Freeze accumulated time before stopping the clock
    if (wallStartRef.current) {
      accumulatedSecsRef.current += Math.floor((Date.now() - wallStartRef.current) / 1000);
      wallStartRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    // Restart wall clock from now, keep accumulated
    wallStartRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    accumulatedSecsRef.current = 0;
    wallStartRef.current = isRunning ? Date.now() : null;
    setElapsed(0);

    if (timerType === 'pomodoro') {
      const dur = getPhaseDuration('focus', pomodoroSettings);
      phaseStartRef.current = isRunning ? Date.now() : null;
      phaseTotalSecsRef.current = dur;
      setPomodoroPhase('focus');
      setPomodoroCount(0);
      pomodoroPhaseRef.current = 'focus';
      pomodoroCountRef.current = 0;
      setPhaseSecondsLeft(dur);
    }
    toast('Timer reset', { icon: '↺' });
  }, [isRunning, timerType, pomodoroSettings]);

  const stop = useCallback(async (notes = '') => {
    if (!sessionId) return;

    // Capture final elapsed from wall clock before stopping
    const finalElapsed = getElapsed();

    clearInterval(intervalRef.current);
    setIsRunning(false);
    wallStartRef.current = null;
    accumulatedSecsRef.current = 0;

    try {
      await api.put(`/sessions/${sessionId}/end`, { notes });
      toast.success(`Session saved! ${formatTime(finalElapsed)} studied.`);
    } catch (err) {
      toast.error('Failed to save session');
    }

    socketEmitRef.current.stop?.();
    setSessionId(null);
    setElapsed(0);
    setStartTime(null);

    if (timerType === 'pomodoro') {
      const dur = getPhaseDuration('focus', pomodoroSettings);
      phaseTotalSecsRef.current = dur;
      phaseStartRef.current = null;
      setPomodoroPhase('focus');
      setPomodoroCount(0);
      pomodoroPhaseRef.current = 'focus';
      pomodoroCountRef.current = 0;
      setPhaseSecondsLeft(dur);
    }

    return finalElapsed;
  }, [sessionId, getElapsed, timerType, pomodoroSettings]);

  const updatePomodoroSettings = useCallback((newSettings) => {
    const merged = { ...pomodoroSettings, ...newSettings };
    setPomodoroSettings(merged);
    pomodoroSettingsRef.current = merged;

    if (!isRunning && pomodoroPhaseRef.current === 'focus') {
      const dur = merged.sessionMinutes * 60;
      phaseTotalSecsRef.current = dur;
      setPhaseSecondsLeft(dur);
    }
  }, [isRunning, pomodoroSettings]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatTimerDisplay = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <TimerContext.Provider value={{
      isRunning, elapsed, timerType, setTimerType,
      selectedCourse, setSelectedCourse,
      sessionId, startTime, accentColor, setAccentColor,
      start, pause, resume, stop, reset,
      formatTime, formatTimerDisplay, registerSocketEmitters,
      pomodoroSettings, updatePomodoroSettings,
      pomodoroPhase, pomodoroCount, phaseSecondsLeft
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);