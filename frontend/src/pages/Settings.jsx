import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { MdSave, MdPerson, MdNotifications, MdEmojiEvents } from 'react-icons/md';

export default function Settings() {
  const { user, updateUser, updateSettings } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [medalGoals, setMedalGoals] = useState(user?.settings?.medalGoals || { bronze: 180, silver: 240, gold: 300 });
  const [notifications, setNotifications] = useState(user?.settings?.notifications || {
    show: true, sound: true, achievements: true, dailyGoal: true, dailyMedals: true, streaks: true, weeklyBadges: true
  });

  const handleProfileSave = async () => {
    try {
      await updateUser({ name, username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleSettingsSave = async () => {
    try {
      await updateSettings({ ...user.settings, medalGoals, notifications });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
  };

  const toggleNotif = (key) => setNotifications(n => ({ ...n, [key]: !n[key] }));

  return (
    <div>
      <Header title="Settings" />
      <div className="page" style={{ maxWidth: 700 }}>

        {/* Profile */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title"><MdPerson /> Profile</div>
          <div className="form-group">
            <label>Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Username <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(used to find you in friend search)</span></label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>@</span>
              <input className="input" style={{ paddingLeft: 26 }} placeholder="yourhandle" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <button className="btn btn-primary" onClick={handleProfileSave}><MdSave /> Save Profile</button>
        </div>

        {/* Medal Goals */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title"><MdEmojiEvents /> Medal Goals</div>
          <p style={{ marginBottom: 16, fontSize: '0.85rem' }}>Set your daily study time targets to earn medals.</p>
          <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
            {['bronze', 'silver', 'gold'].map((tier, i) => (
              <div key={tier}>
                <label>{['🥉 Bronze', '🥈 Silver', '🥇 Gold'][i]}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="input" type="number" value={medalGoals[tier]} onChange={e => setMedalGoals(m => ({ ...m, [tier]: parseInt(e.target.value) || 0 }))} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>min</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 14, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            <strong>How medals work:</strong> Medals are awarded based on your total study time each day. Bronze = {medalGoals.bronze} min, Silver = {medalGoals.silver} min, Gold = {medalGoals.gold} min.
          </div>
          <button className="btn btn-primary" onClick={handleSettingsSave}><MdSave /> Save Settings</button>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-title"><MdNotifications /> Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'show', label: 'Show notifications' },
              { key: 'sound', label: 'Play sound effects' },
              { key: 'achievements', label: 'Achievements' },
              { key: 'dailyGoal', label: 'Daily goal reached' },
              { key: 'dailyMedals', label: 'Daily medals' },
              { key: 'streaks', label: 'Streak, early bird & night owl' },
              { key: 'weeklyBadges', label: 'Weekly badges' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</span>
                <div className={`toggle ${notifications[key] ? 'on' : ''}`} onClick={() => toggleNotif(key)}>
                  <div className="toggle-thumb" />
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSettingsSave}><MdSave /> Save</button>
        </div>
      </div>
    </div>
  );
}
