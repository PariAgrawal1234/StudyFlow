import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import AddSessionModal from '../components/AddSessionModal';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { MdAdd, MdDelete, MdClose, MdFilterList, MdAccessTime, MdSearch } from 'react-icons/md';
import '../styles/Sessions.css';

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PER_PAGE, page });
      if (filterCourse) params.set('course', filterCourse);
      if (filterDate) params.set('date', filterDate);
      const [s, c] = await Promise.all([
        api.get(`/sessions?${params}`),
        api.get('/courses')
      ]);
      setSessions(s.data.sessions || []);
      setTotal(s.data.total || 0);
      setCourses(c.data);
    } finally { setLoading(false); }
  }, [page, filterCourse, filterDate]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    await api.delete(`/sessions/${id}`);
    toast.success('Session deleted');
    load();
  };

  // Group sessions by date
  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / PER_PAGE);
  const totalFiltered = sessions.reduce((s, sess) => s + (sess.duration || 0), 0);

  return (
    <div>
      <Header title="Sessions" />
      <div className="page">
        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto', minWidth: 160 }} value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setPage(1); }}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.emoji} {c.name}</option>)}
          </select>
          <input className="input" type="date" style={{ width: 'auto' }} value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }} />
          {(filterCourse || filterDate) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCourse(''); setFilterDate(''); setPage(1); }}>
              <MdClose /> Clear
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {sessions.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {total} sessions · {fmtHM(totalFiltered)} shown
              </span>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <MdAdd /> Add Session
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto 12px' }} />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon"><MdAccessTime style={{ fontSize: '3rem' }} /></div>
            <div className="empty-title">No sessions found</div>
            <div className="empty-desc">{filterCourse || filterDate ? 'Try changing your filters' : 'Start the timer to record your first study session'}</div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><MdAdd /> Add Manually</button>
          </div>
        ) : (
          <>
            {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, daySessions]) => {
              const dayTotal = daySessions.reduce((s, sess) => s + (sess.duration || 0), 0);
              return (
                <div key={date} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {format(parseISO(date), 'EEEE, MMMM d yyyy')}
                    </div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{fmtHM(dayTotal)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {daySessions.map(s => (
                      <div key={s._id} className="session-row">
                        <div className="session-color-bar" style={{ background: s.course?.color || 'var(--accent-primary)' }} />
                        <div className="session-course-info">
                          <div className="session-course-name">
                            {s.course?.emoji || '📖'} {s.courseName || 'General Study'}
                          </div>
                          {s.notes && <div className="session-notes">{s.notes}</div>}
                        </div>
                        <div className="session-time-info">
                          <div className="session-duration">{fmtHM(s.duration || 0)}</div>
                          <div className="session-hours">
                            {s.startTime ? format(new Date(s.startTime), 'HH:mm') : '—'}
                            {s.endTime ? ` – ${format(new Date(s.endTime), 'HH:mm')}` : ''}
                          </div>
                        </div>
                        <div className="session-type-badge">
                          <span className={`badge ${s.timerType === 'pomodoro' ? 'badge-purple' : 'badge-blue'}`}>
                            {s.timerType === 'pomodoro' ? '🍅' : '⏱'}
                          </span>
                        </div>
                        <button className="btn btn-danger btn-sm session-delete" onClick={() => handleDelete(s._id)}>
                          <MdDelete />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ padding: '6px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
      {showAddModal && <AddSessionModal courses={courses} onSave={() => { load(); setShowAddModal(false); }} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}