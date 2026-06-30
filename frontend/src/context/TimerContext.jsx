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
  const [elapsed, setElapsed] = useState(0); // seconds counted up (always tracked, used for stopwatch + saved duration)
  const [timerType, setTimerType] = useState('stopwatch');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [accentColor, setAccentColor] = useState('#A78BFA'); // purple default

  // Pomodoro-specific state
  const [pomodoroSettings, setPomodoroSettings] = useState(DEFAULT_POMODORO_SETTINGS);
  const [pomodoroPhase, setPomodoroPhase] = useState('focus'); // 'focus' | 'break' | 'longBreak'
  const [pomodoroCount, setPomodoroCount] = useState(0); // completed focus sessions
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(DEFAULT_POMODORO_SETTINGS.sessionMinutes * 60);

  const intervalRef = useRef(null);
  const socketEmitRef = useRef({ start: null, stop: null });

  const registerSocketEmitters = (emitStart, emitStop) => {
    socketEmitRef.current = { start: emitStart, stop: emitStop };
  };

  const phaseDurationSecs = useCallback((phase) => {
    if (phase === 'break') return pomodoroSettings.breakMinutes * 60;
    if (phase === 'longBreak') return pomodoroSettings.longBreakMinutes * 60;
    return pomodoroSettings.sessionMinutes * 60;
  }, [pomodoroSettings]);

  // Main tick loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);

        if (timerType === 'pomodoro') {
          setPhaseSecondsLeft(prev => {
            if (prev <= 1) {
              // Phase complete — play a notification and switch phase
              handlePhaseComplete();
              return 0; // will be reset by handlePhaseComplete via setPhaseSecondsLeft below
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timerType]);

  const handlePhaseComplete = useCallback(() => {
    setPomodoroPhase(currentPhase => {
      let nextPhase;
      let nextCount = pomodoroCount;

      if (currentPhase === 'focus') {
        nextCount = pomodoroCount + 1;
        setPomodoroCount(nextCount);
        const isLongBreakDue = nextCount % pomodoroSettings.sessionsBeforeLongBreak === 0;
        nextPhase = isLongBreakDue ? 'longBreak' : 'break';
        toast.success('🎉 Focus session complete! Time for a break.', { duration: 4000 });
      } else {
        nextPhase = 'focus';
        toast.success('☕ Break over! Back to focus.', { duration: 4000 });
      }

      setPhaseSecondsLeft(phaseDurationSecs(nextPhase));
      return nextPhase;
    });
  }, [pomodoroCount, pomodoroSettings, phaseDurationSecs]);

  const start = useCallback(async (courseId, courseName) => {
    try {
      const res = await api.post('/sessions/start', { courseId, timerType });
      setSessionId(res.data._id);
      setStartTime(new Date());
      setIsRunning(true);
      setElapsed(0);
      if (timerType === 'pomodoro') {
        setPomodoroPhase('focus');
        setPomodoroCount(0);
        setPhaseSecondsLeft(pomodoroSettings.sessionMinutes * 60);
      }
      socketEmitRef.current.start?.(courseName || 'General Study');
      toast.success('Session started!');
    } catch (err) {
      toast.error('Failed to start session');
    }
  }, [timerType, pomodoroSettings]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  // Reset: keeps the session running (if active) but zeroes the clock back to start
  const reset = useCallback(() => {
    setElapsed(0);
    if (timerType === 'pomodoro') {
      setPomodoroPhase('focus');
      setPomodoroCount(0);
      setPhaseSecondsLeft(pomodoroSettings.sessionMinutes * 60);
    }
    toast('Timer reset', { icon: '↺' });
  }, [timerType, pomodoroSettings]);

  const stop = useCallback(async (notes = '') => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await api.put(`/sessions/${sessionId}/end`, { notes });
      toast.success(`Session saved! ${formatTime(elapsed)} studied.`);
    } catch (err) {
      toast.error('Failed to save session');
    }
    socketEmitRef.current.stop?.();
    setSessionId(null);
    setElapsed(0);
    setStartTime(null);
    if (timerType === 'pomodoro') {
      setPomodoroPhase('focus');
      setPomodoroCount(0);
      setPhaseSecondsLeft(pomodoroSettings.sessionMinutes * 60);
    }
    return elapsed;
  }, [sessionId, elapsed, timerType, pomodoroSettings]);

  const updatePomodoroSettings = useCallback((newSettings) => {
    setPomodoroSettings(prev => {
      const merged = { ...prev, ...newSettings };
      // If not running, immediately reflect new focus duration on the countdown
      if (!isRunning && pomodoroPhase === 'focus') {
        setPhaseSecondsLeft(merged.sessionMinutes * 60);
      }
      return merged;
    });
  }, [isRunning, pomodoroPhase]);

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
      // Pomodoro
      pomodoroSettings, updatePomodoroSettings,
      pomodoroPhase, pomodoroCount, phaseSecondsLeft
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext); 