import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdTimer, MdBook, MdFlag, MdBarChart,
  MdSettings, MdLogout, MdSchool, MdEmojiEvents, MdDirectionsRun
} from 'react-icons/md';
import '../styles/Sidebar.css';

const navItems = [
  { to: '/', icon: MdDashboard, label: 'Dashboard' },
  { to: '/timer', icon: MdTimer, label: 'Timer' },
  { to: '/courses', icon: MdBook, label: 'Courses' },
  { to: '/goals', icon: MdFlag, label: 'Goals' },
  { to: '/stats', icon: MdBarChart, label: 'Statistics' },
  { to: '/activities', icon: MdDirectionsRun, label: 'Activities' },
  { to: '/leaderboard', icon: MdEmojiEvents, label: 'Medals' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={label}>
            <Icon />
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
          <div className="user-avatar" title={user.name}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </aside>
  );
}
