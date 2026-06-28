import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const [studyingFriends, setStudyingFriends] = useState(new Map()); // userId -> courseName

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      return;
    }

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('friend_online', ({ userId, name }) => {
      setOnlineFriends(prev => new Set([...prev, userId]));
    });

    socket.on('friend_offline', ({ userId }) => {
      setOnlineFriends(prev => { const n = new Set(prev); n.delete(userId); return n; });
      setStudyingFriends(prev => { const n = new Map(prev); n.delete(userId); return n; });
    });

    socket.on('friend_studying', ({ userId, name, courseName }) => {
      setStudyingFriends(prev => new Map(prev).set(userId, courseName));
      toast(`${name} started studying ${courseName}`, { icon: '📚', duration: 3000 });
    });

    socket.on('friend_stopped', ({ userId }) => {
      setStudyingFriends(prev => { const n = new Map(prev); n.delete(userId); return n; });
    });

    return () => socket.disconnect();
  }, [user]);

  const emitTimerStart = (courseName) => {
    socketRef.current?.emit('timer_start', { courseName });
  };

  const emitTimerStop = () => {
    socketRef.current?.emit('timer_stop');
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineFriends, studyingFriends, emitTimerStart, emitTimerStop }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
