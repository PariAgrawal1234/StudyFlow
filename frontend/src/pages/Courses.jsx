import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdClose, MdBook } from 'react-icons/md';

const COLORS = ['#5BA4CF','#38BDF8','#34D399','#2DD4BF','#A78BFA','#FB7185','#FBBF24','#F97316'];
const EMOJIS = ['📚','🎓','💻','🔬','🧮','📐','🌍','🎨','💡','⚗️','📊','🏛️'];

function CourseModal({ course, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', color: COLORS[0], emoji: '📚', totalHours: '', ...course });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Course name required');
    try {
      if (course?._id) {
        await api.put(`/courses/${course._id}`, form);
        toast.success('Course updated');
      } else {
        await api.post('/courses', form);
        toast.success('Course created');
      }
      onSave();
    } catch { toast.error('Failed to save course'); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{course?._id ? 'Edit Course' : 'New Course'}</span>
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
          <label>Course Name</label>
          <input className="input" placeholder="e.g. Data Structures" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Total Hours Goal (optional)</label>
          <input className="input" type="number" placeholder="e.g. 80" value={form.totalHours} onChange={e => set('totalHours', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Course</button>
        </div>
      </div>
    </div>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/courses').then(r => setCourses(r.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    await api.delete(`/courses/${id}`);
    toast.success('Course deleted');
    load();
  };

  return (
    <div>
      <Header title="Courses" />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <MdAdd /> Add Course
          </button>
        </div>
        {courses.length === 0 ? (
          <div className="card empty-state">
            <MdBook className="empty-icon" style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
            <div className="empty-title">No courses yet</div>
            <div className="empty-desc">Add your first course to start tracking study time</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Course</button>
          </div>
        ) : (
          <div className="grid-3">
            {courses.map(c => (
              <div key={c._id} className="card course-card" style={{ borderTop: `3px solid ${c.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '2rem' }}>{c.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '1rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {Math.floor((c.studiedMinutes || 0) / 60)}h {(c.studiedMinutes || 0) % 60}m studied
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(c); setShowModal(true); }}><MdEdit /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><MdDelete /></button>
                  </div>
                </div>
                {c.totalHours > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>Progress</span>
                      <span>{Math.min(100, Math.round(((c.studiedMinutes || 0) / (c.totalHours * 60)) * 100))}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(((c.studiedMinutes || 0) / (c.totalHours * 60)) * 100))}%`, background: c.color }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Goal: {c.totalHours}h</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && <CourseModal course={editing} onSave={() => { load(); setShowModal(false); }} onClose={() => setShowModal(false)} />}
    </div>
  );
}
