import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MdPersonAdd, MdSearch, MdCheck, MdClose, MdPeople,
  MdTimer, MdEmojiEvents, MdLocalFireDepartment, MdPersonRemove,
  MdNotifications
} from 'react-icons/md';
import '../styles/Friends.css';

function fmtHM(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function Avatar({ name, avatar, size = 40, isOnline = false, isStudying = false }) {
  return (
    <div className="avatar-wrapper" style={{ '--size': `${size}px` }}>
      <div className="avatar-circle" style={{ width: size, height: size, background: `hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 35%)` }}>
        {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : name?.charAt(0).toUpperCase()}
      </div>
      {isStudying ? (
        <div className="status-dot studying" title="Currently studying" />
      ) : isOnline ? (
        <div className="status-dot online" title="Online" />
      ) : null}
    </div>
  );
}

function FriendCard({ friend, onRemove, studyingFriends, onlineFriends }) {
  const isOnline = onlineFriends.has(friend._id);
  const courseName = studyingFriends.get(friend._id) || (friend.currentlyStudying?.active ? friend.currentlyStudying.courseName : null);
  const isStudying = !!courseName;

  return (
    <div className={`friend-card ${isStudying ? 'studying' : ''}`}>
      <div className="friend-card-top">
        <Avatar name={friend.name} avatar={friend.avatar} size={48} isOnline={isOnline || friend.isOnline} isStudying={isStudying} />
        <div className="friend-info">
          <div className="friend-name">{friend.name}</div>
          <div className="friend-handle">@{friend.username || friend.email?.split('@')[0]}</div>
          {isStudying ? (
            <div className="studying-badge">
              <span className="studying-pulse" />
              Studying: {courseName}
            </div>
          ) : (
            <div className="friend-status-text">
              {isOnline || friend.isOnline ? 'Online' : friend.lastSeen ? `${formatDistanceToNow(new Date(friend.lastSeen))} ago` : 'Offline'}
            </div>
          )}
        </div>
        <button className="btn btn-danger btn-sm remove-btn" onClick={() => onRemove(friend._id)} title="Remove friend">
          <MdPersonRemove />
        </button>
      </div>

      <div className="friend-stats-row">
        <div className="friend-stat">
          <MdTimer className="fstat-icon" />
          <div>
            <div className="fstat-val">{fmtHM(friend.todayMinutes || 0)}</div>
            <div className="fstat-lbl">Today</div>
          </div>
        </div>
        <div className="friend-stat">
          <MdLocalFireDepartment className="fstat-icon" style={{ color: '#FBBF24' }} />
          <div>
            <div className="fstat-val">{friend.streak || 0}d</div>
            <div className="fstat-lbl">Streak</div>
          </div>
        </div>
        <div className="friend-stat">
          <MdEmojiEvents className="fstat-icon" style={{ color: '#FBBF24' }} />
          <div>
            <div className="fstat-val">{(friend.medals?.gold || 0)}🥇 {(friend.medals?.silver || 0)}🥈</div>
            <div className="fstat-lbl">Medals</div>
          </div>
        </div>
        <div className="friend-stat">
          <span className="fstat-icon">📚</span>
          <div>
            <div className="fstat-val">{friend.totalSessions || 0}</div>
            <div className="fstat-lbl">Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Friends() {
  const [tab, setTab] = useState('room');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const { onlineFriends, studyingFriends } = useSocket();
  const { user } = useAuth();

  const load = useCallback(() => {
    Promise.all([
      api.get('/friends'),
      api.get('/friends/requests')
    ]).then(([f, r]) => {
      setFriends(f.data);
      setRequests(r.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh friends every 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch { } finally { setSearching(false); }
  }, []);

  const sendRequest = async (userId) => {
    try {
      const res = await api.post(`/friends/request/${userId}`);
      toast.success(res.data.message);
      setSearchResults(prev => prev.map(u => u._id === userId ? { ...u, requestSent: true } : u));
      if (res.data.mutual) load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const acceptRequest = async (fromUserId) => {
    try {
      await api.post(`/friends/accept/${fromUserId}`);
      toast.success('Friend request accepted!');
      load();
    } catch { toast.error('Failed to accept'); }
  };

  const declineRequest = async (fromUserId) => {
    try {
      await api.post(`/friends/decline/${fromUserId}`);
      setRequests(prev => prev.filter(r => r.from._id !== fromUserId));
      toast.success('Request declined');
    } catch { toast.error('Failed to decline'); }
  };

  const removeFriend = async (userId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await api.delete(`/friends/${userId}`);
      setFriends(prev => prev.filter(f => f._id !== userId));
      toast.success('Friend removed');
    } catch { toast.error('Failed to remove'); }
  };

  const studyingNow = friends.filter(f => f.currentlyStudying?.active || studyingFriends.has(f._id));
  const onlineNow = friends.filter(f => (f.isOnline || onlineFriends.has(f._id)) && !studyingFriends.has(f._id) && !f.currentlyStudying?.active);

  return (
    <div>
      <Header title="Study Room" />
      <div className="page">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            <button className={`tab ${tab === 'room' ? 'active' : ''}`} onClick={() => setTab('room')}>
              <MdPeople style={{ verticalAlign: 'middle' }} /> Room
            </button>
            <button className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
              Friends {friends.length > 0 && <span className="tab-count">{friends.length}</span>}
            </button>
            <button className={`tab ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
              <MdPersonAdd style={{ verticalAlign: 'middle' }} /> Add
              {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
            </button>
          </div>
        </div>

        {/* ── ROOM TAB ── */}
        {tab === 'room' && (
          <div className="room-view">
            {friends.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-title">Your study room is empty</div>
                <div className="empty-desc">Add friends to see their study progress in real time</div>
                <button className="btn btn-primary" onClick={() => setTab('add')}><MdPersonAdd /> Add Friends</button>
              </div>
            ) : (
              <>
                {/* Live studying now */}
                {studyingNow.length > 0 && (
                  <div className="room-section">
                    <div className="room-section-title">
                      <span className="live-dot" />
                      Studying Now · {studyingNow.length}
                    </div>
                    <div className="studying-now-grid">
                      {studyingNow.map(f => {
                        const courseName = studyingFriends.get(f._id) || f.currentlyStudying?.courseName || 'General Study';
                        const startedAt = f.currentlyStudying?.startedAt;
                        return (
                          <div key={f._id} className="studying-now-card">
                            <Avatar name={f.name} avatar={f.avatar} size={52} isStudying />
                            <div className="sn-info">
                              <div className="sn-name">{f.name}</div>
                              <div className="sn-course">📚 {courseName}</div>
                              {startedAt && (
                                <div className="sn-duration">
                                  Started {formatDistanceToNow(new Date(startedAt))} ago
                                </div>
                              )}
                            </div>
                            <div className="sn-today">
                              <div className="sn-time">{fmtHM(f.todayMinutes || 0)}</div>
                              <div className="sn-label">today</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Online not studying */}
                {onlineNow.length > 0 && (
                  <div className="room-section">
                    <div className="room-section-title" style={{ color: 'var(--accent-green)' }}>
                      Online · {onlineNow.length}
                    </div>
                    <div className="online-grid">
                      {onlineNow.map(f => (
                        <div key={f._id} className="online-mini-card">
                          <Avatar name={f.name} avatar={f.avatar} size={36} isOnline />
                          <div className="om-name">{f.name}</div>
                          <div className="om-today">{fmtHM(f.todayMinutes || 0)} today</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All friends summary */}
                <div className="room-section">
                  <div className="room-section-title">All Friends · {friends.length}</div>
                  {/* Leaderboard view */}
                  <div className="room-leaderboard">
                    <div className="lb-header">
                      <span>Name</span>
                      <span>Today</span>
                      <span>Streak</span>
                      <span>Total</span>
                      <span>Medals</span>
                    </div>
                    {[...friends].sort((a, b) => (b.todayMinutes || 0) - (a.todayMinutes || 0)).map((f, i) => (
                      <div key={f._id} className="lb-row">
                        <div className="lb-rank">#{i + 1}</div>
                        <div className="lb-user">
                          <Avatar name={f.name} avatar={f.avatar} size={32}
                            isOnline={f.isOnline || onlineFriends.has(f._id)}
                            isStudying={studyingFriends.has(f._id) || f.currentlyStudying?.active} />
                          <div>
                            <div className="lb-name">{f.name}</div>
                            <div className="lb-handle">@{f.username || f.email?.split('@')[0]}</div>
                          </div>
                        </div>
                        <div className="lb-cell" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{fmtHM(f.todayMinutes || 0)}</div>
                        <div className="lb-cell">{f.streak || 0}🔥</div>
                        <div className="lb-cell">{fmtHM(f.totalMinutes || 0)}</div>
                        <div className="lb-cell" style={{ fontSize: '0.78rem' }}>
                          {f.medals?.gold > 0 && `${f.medals.gold}🥇 `}
                          {f.medals?.silver > 0 && `${f.medals.silver}🥈 `}
                          {f.medals?.bronze > 0 && `${f.medals.bronze}🥉`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── FRIENDS TAB ── */}
        {tab === 'friends' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-icon">👋</div>
                <div className="empty-title">No friends yet</div>
                <div className="empty-desc">Search for people and send them a friend request!</div>
                <button className="btn btn-primary" onClick={() => setTab('add')}><MdPersonAdd /> Find Friends</button>
              </div>
            ) : (
              <div className="friends-grid">
                {friends.map(f => (
                  <FriendCard key={f._id} friend={f} onRemove={removeFriend} studyingFriends={studyingFriends} onlineFriends={onlineFriends} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADD FRIENDS TAB ── */}
        {tab === 'add' && (
          <div style={{ maxWidth: 560 }}>
            {/* Pending requests */}
            {requests.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title"><MdNotifications /> Pending Requests · {requests.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {requests.map(r => (
                    <div key={r._id} className="request-item">
                      <Avatar name={r.from?.name || '?'} avatar={r.from?.avatar} size={40} />
                      <div className="request-info">
                        <div className="request-name">{r.from?.name}</div>
                        <div className="request-handle">@{r.from?.username || r.from?.email?.split('@')[0]}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => acceptRequest(r.from._id)}>
                          <MdCheck /> Accept
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => declineRequest(r.from._id)}>
                          <MdClose />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="card">
              <div className="card-title"><MdSearch /> Find People</div>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Search by name, email, or @username..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>

              {searching && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Searching...</div>}

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {searchResults.map(u => (
                    <div key={u._id} className="search-result-item">
                      <Avatar name={u.name} avatar={u.avatar} size={40} />
                      <div className="request-info">
                        <div className="request-name">{u.name}</div>
                        <div className="request-handle">@{u.username || u.email?.split('@')[0]}</div>
                      </div>
                      {u.isFriend ? (
                        <span className="badge badge-green">Friends ✓</span>
                      ) : u.requestSent ? (
                        <span className="badge badge-blue">Sent ✓</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u._id)}>
                          <MdPersonAdd /> Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No users found for "{searchQuery}"
                </div>
              )}

              {searchQuery.length === 0 && (
                <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <p>💡 Share your username with friends so they can find you:</p>
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.02em' }}>
                    @{user?.username || user?.name?.toLowerCase().replace(/\s+/g, '') || 'set-username-in-settings'}
                  </div>
                  <p style={{ marginTop: 8, fontSize: '0.75rem' }}>Update your username in Settings → Profile</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
