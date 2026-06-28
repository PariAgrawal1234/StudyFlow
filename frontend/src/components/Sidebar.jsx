import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdTimer, MdBook, MdFlag, MdBarChart,
  MdSettings, MdLogout, MdSchool, MdEmojiEvents,
  MdDirectionsRun, MdPeople
} from 'react-icons/md';
import api from '../utils/api';
import '../styles/Sidebar.css';

const navItems = [
  { to: '/', icon: MdDashboard, label: 'Dashboard' },
  { to: '/timer', icon: MdTimer, label: 'Timer' },
  { to: '/friends', icon: MdPeople, label: 'Room', badge: true },
  { to: '/courses', icon: MdBook, label: 'Courses' },
  { to: '/goals', icon: MdFlag, label: 'Goals' },
  { to: '/stats', icon: MdBarChart, label: 'Stats' },
  { to: '/activities', icon: MdDirectionsRun, label: 'Activities' },
  { to: '/leaderboard', icon: MdEmojiEvents, label: 'Medals' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      api.get('/friends/requests').then(r => {
        setPendingRequests(r.data.filter(req => req.status === 'pending').length);
      }).catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <MdSchool className="logo-icon" />
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={label}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Icon />
              {badge && pendingRequests > 0 && (
                <span className="nav-badge">{pendingRequests}</span>
              )}
            </div>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Settings">
          <MdSettings />
          <span className="nav-label">Settings</span>
        </NavLink>
        <button className="nav-item logout-btn" onClick={handleLogout} title="Logout">
          <MdLogout />
          <span className="nav-label">Logout</span>
        </button>
        {user && (
          <div className="user-avatar" title={user.name} onClick={() => navigate('/settings')}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </aside>
  );
}
