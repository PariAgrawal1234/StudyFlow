import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdSchool, MdEmail, MdLock, MdPerson } from 'react-icons/md';
import '../styles/Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        if (!form.name.trim()) { toast.error('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
        toast.success('Account created! Welcome to StudyFlow!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <MdSchool />
        </div>
        <h1 className="auth-title">StudyFlow</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'Welcome back! Track your progress.' : 'Start your learning journey.'}</p>

        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-icon-wrapper">
                <MdPerson className="input-icon" />
                <input className="input input-with-icon" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-wrapper">
              <MdEmail className="input-icon" />
              <input className="input input-with-icon" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrapper">
              <MdLock className="input-icon" />
              <input className="input input-with-icon" type="password" placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'} value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-features">
          <div className="feature-item">📊 Track study sessions</div>
          <div className="feature-item">🏅 Earn daily medals</div>
          <div className="feature-item">🎯 Set & achieve goals</div>
          <div className="feature-item">📈 Visualize progress</div>
        </div>
      </div>
    </div>
  );
}
