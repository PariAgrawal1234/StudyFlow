import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAdd, MdEdit, MdDelete, MdClose, MdFlag, MdCheckCircle } from 'react-icons/md';

function GoalModal({ goal, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    title: '', description: '', type: 'custom',
    targetHours: '', targetSessions: '',
    color: '#5BA4CF',
    ...(goal || {}),
    startDate: goal?.startDate ? format(new Date(goal.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: goal?.endDate ? format(new Date(goal.endDate), 'yyyy-MM-dd') : ''
  }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Goal title required');
    if (!form.endDate) return toast.error('End date required');
    try {
      if (goal?._id) {
        await api.put(`/goals/${goal._id}`, form);
        toast.success('Goal updated');
      } else {
        await api.post('/goals', form);
        toast.success('Goal created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{goal?._id ? 'Edit Goal' : 'New Goal'}</span>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input className="input" placeholder="e.g. Internship Season Prep" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="semester">Semester</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input className="input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Target Hours</label>
            <input className="input" type="number" placeholder="e.g. 112" value={form.targetHours} onChange={e => set('targetHours', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Sessions</label>
            <input className="input" type="number" placeholder="e.g. 50" value={form.targetSessions} onChange={e => set('targetSessions', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea className="input" rows={2} placeholder="What is this goal about?" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Goal</button>
        </div>
      </div>
    </div>
  );
}

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get('/goals'),
      api.get('/goals/active')
    ]).then(([g, a]) => {
      setGoals(g.data);
      setActiveGoals(a.data);
    }).catch((err) => {
      console.error('Failed to load goals:', err);
      setLoadError(err.response?.data?.message || 'Failed to load goals. Please refresh.');
      toast.error('Failed to load goals');
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  return (
    <div>
      <Header title="Goals" />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <MdAdd /> New Goal
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            Loading goals...
          </div>
        )}

        {!loading && loadError && (
          <div className="card" style={{ borderColor: 'rgba(251,113,133,0.3)', marginBottom: 20, textAlign: 'center', padding: 24 }}>
            <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>⚠ {loadError}</div>
            <button className="btn btn-secondary btn-sm" onClick={load}>Try Again</button>
          </div>
        )}

        {!loading && !loadError && (
        <>
        {activeGoals.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>✓ Active Goals</h3>
            <div className="grid-2">
              {activeGoals.map(g => (
                <div key={g._id} className="card" style={{ borderLeft: `3px solid ${g.goal.color || '#5BA4CF'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '1rem', marginBottom: 2 }}>{g.goal.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {format(new Date(g.goal.startDate), 'dd/MM/yy')} – {format(new Date(g.goal.endDate), 'dd/MM/yy')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(g.goal); setShowModal(true); }}><MdEdit /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.goal._id)}><MdDelete /></button>
                    </div>
                  </div>
                  <div className="grid-3" style={{ gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)' }}>{fmtHM(g.studiedMinutes)}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Studied</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)' }}>{g.totalSessions}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sessions</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)' }}>{g.studyDays}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Study Days</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Study: {g.studyProgressPercent}%</span>
                      <span>Time: {g.timeElapsedPercent}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill progress-fill-blue" style={{ width: `${g.studyProgressPercent}%` }} />
                    </div>
                    <div style={{ height: 4 }} />
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${g.timeElapsedPercent}%`, background: 'var(--accent-amber)' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Required: {fmtHM(g.requiredPaceMinPerDay)}/day</span>
                    <span>{g.daysRemaining} days left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.filter(g => !activeGoals.find(a => a.goal._id === g._id)).length > 0 && (
          <div>
            <h3 style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>All Goals</h3>
            <div className="grid-2">
              {goals.filter(g => !activeGoals.find(a => a.goal._id === g._id)).map(g => (
                <div key={g._id} className="card" style={{ opacity: 0.75 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{g.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {format(new Date(g.startDate), 'dd/MM/yy')} – {format(new Date(g.endDate), 'dd/MM/yy')} · {g.targetHours}h target
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(g); setShowModal(true); }}><MdEdit /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}><MdDelete /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && (
          <div className="card empty-state">
            <MdFlag style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
            <div className="empty-title">No goals yet</div>
            <div className="empty-desc">Set a study goal to track your progress and stay motivated</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Your First Goal</button>
          </div>
        )}
        </>
        )}
      </div>
      {showModal && <GoalModal goal={editing} onSave={() => { load(); setShowModal(false); }} onClose={() => setShowModal(false)} />}
    </div>
  );
}