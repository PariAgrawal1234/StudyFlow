import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdClose } from 'react-icons/md';

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AddSessionModal({ courses = [], onSave, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    courseId: '',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    notes: ''
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      const startDt = new Date(`${form.date}T${form.startTime}`);
      const endDt = new Date(`${form.date}T${form.endTime}`);
      if (endDt <= startDt) return toast.error('End time must be after start time');
      const duration = Math.round((endDt - startDt) / 60000);
      await api.post('/sessions', {
        courseId: form.courseId || undefined,
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
        duration,
        notes: form.notes
      });
      toast.success(`Session added (${fmtHM(duration)})`);
      onSave();
    } catch { toast.error('Failed to add session'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Session Manually</span>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="form-group">
          <label>Course</label>
          <select className="select" value={form.courseId} onChange={e => set('courseId', e.target.value)}>
            <option value="">📖 General Study</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input className="input" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input className="input" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>
        {form.startTime && form.endTime && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--accent-green)' }}>
            ⏱ Duration: {fmtHM(Math.max(0, Math.round((new Date(`${form.date}T${form.endTime}`) - new Date(`${form.date}T${form.startTime}`)) / 60000)))}
          </div>
        )}
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea className="input" rows={2} placeholder="What did you study?" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add Session</button>
        </div>
      </div>
    </div>
  );
}