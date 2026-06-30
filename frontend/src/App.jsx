import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Courses from './pages/Courses';
import Goals from './pages/Goals';
import Statistics from './pages/Statistics';
import Activities from './pages/Activities';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Friends from './pages/Friends';
import Sessions from './pages/Sessions';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a2540',
                  color: '#E2E8F0',
                  border: '1px solid #243047',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                },
                success: { iconTheme: { primary: '#34D399', secondary: '#1a2540' } },
                error: { iconTheme: { primary: '#FB7185', secondary: '#1a2540' } },
              }}
            />
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/timer" element={<ProtectedRoute><AppLayout><Timer /></AppLayout></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><AppLayout><Courses /></AppLayout></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><AppLayout><Goals /></AppLayout></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><AppLayout><Statistics /></AppLayout></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><AppLayout><Activities /></AppLayout></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><AppLayout><Friends /></AppLayout></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><AppLayout><Sessions /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </TimerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}