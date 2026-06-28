import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [timerType, setTimerType] = useState('stopwatch');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start = useCallback(async (courseId) => {
    try {
      const res = await api.post('/sessions/start', { courseId, timerType });
      setSessionId(res.data._id);
      setStartTime(new Date());
      setIsRunning(true);
      setElapsed(0);
      toast.success('Session started!');
    } catch (err) {
      toast.error('Failed to start session');
    }
  }, [timerType]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(async (notes = '') => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await api.put(`/sessions/${sessionId}/end`, { notes });
      toast.success(`Session saved! ${formatTime(elapsed)} studied.`);
    } catch (err) {
      toast.error('Failed to save session');
    }
    setSessionId(null);
    setElapsed(0);
    setStartTime(null);
    return elapsed;
  }, [sessionId, elapsed]);

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
      sessionId, startTime,
      start, pause, resume, stop,
      formatTime, formatTimerDisplay
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
