import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdClose, MdDirectionsRun } from 'react-icons/md';

const COLORS = ['#34D399','#5BA4CF','#A78BFA','#FB7185','#FBBF24','#2DD4BF','#F97316','#38BDF8'];
const EMOJIS = ['🎯','💪','🏃','📖','🧘','🎨','🎵','💡','🔥','⚡','🌟','🎓'];

function ActivityModal({ activity, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', color: COLORS[0], emoji: '🎯', ...activity });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Activity name required');
    try {
      if (activity?._id) {
        await api.put(`/activities/${activity._id}`, form);
        toast.success('Activity updated');
      } else {
        await api.post('/activities', form);
        toast.success('Activity created!');
      }
      onSave();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{activity?._id ? 'Edit Activity' : 'New Activity'}</span>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="form-group">
          <label>Emoji</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => set('emoji', e)} style={{ fontSize: '1.4rem', background: form.emoji === e ? 'var(--bg-input)' : 'none', border: form.emoji === e ? '2px solid var(--accent-primary)' : '2px solid transparent', borderRadius: 8, padding: '4px 6px', cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Activity Name</label>
          <input className="input" placeholder="e.g. Morning Run" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/activities').then(r => setActivities(r.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return;
    await api.delete(`/activities/${id}`);
    toast.success('Activity deleted');
    load();
  };

  return (
    <div>
      <Header title="Activities" />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <MdAdd /> Add Activity
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">No activities yet</div>
            <div className="empty-desc">Track activities beyond studying — workouts, hobbies, habits</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Activity</button>
          </div>
        ) : (
          <div className="grid-3">
            {activities.map(a => (
              <div key={a._id} className="card" style={{ borderTop: `3px solid ${a.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '2rem' }}>{a.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{a.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{Math.floor((a.totalMinutes || 0) / 60)}h total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(a); setShowModal(true); }}><MdEdit /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}><MdDelete /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && <ActivityModal activity={editing} onSave={() => { load(); setShowModal(false); }} onClose={() => setShowModal(false)} />}
    </div>
  );
}
