const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const StudySession = require('../models/StudySession');

// GET /api/friends - get my friends list with their stats
router.get('/', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('friends', 'name email username avatar isOnline lastSeen currentlyStudying settings');
    const today = new Date().toISOString().split('T')[0];

    const friendsWithStats = await Promise.all(me.friends.map(async (friend) => {
      const todaySessions = await StudySession.find({ user: friend._id, date: today });
      const todayMinutes = todaySessions.reduce((s, sess) => s + (sess.duration || 0), 0);

      const allSessions = await StudySession.find({ user: friend._id });
      const totalMinutes = allSessions.reduce((s, sess) => s + (sess.duration || 0), 0);

      // streak
      const sortedDates = [...new Set(allSessions.map(s => s.date))].sort().reverse();
      let streak = 0;
      let checkDate = new Date(today);
      for (const d of sortedDates) {
        if (d === checkDate.toISOString().split('T')[0]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }

      // medals last 30 days
      const last30 = new Date(); last30.setDate(last30.getDate() - 30);
      const last30Str = last30.toISOString().split('T')[0];
      const last30Sessions = allSessions.filter(s => s.date >= last30Str);
      const dailyMap = {};
      last30Sessions.forEach(s => { dailyMap[s.date] = (dailyMap[s.date] || 0) + (s.duration || 0); });
      const mg = friend.settings?.medalGoals || { bronze: 180, silver: 240, gold: 300 };
      let gold = 0, silver = 0, bronze = 0;
      Object.values(dailyMap).forEach(m => {
        if (m >= mg.gold) gold++;
        else if (m >= mg.silver) silver++;
        else if (m >= mg.bronze) bronze++;
      });

      return {
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        username: friend.username,
        avatar: friend.avatar,
        isOnline: friend.isOnline,
        lastSeen: friend.lastSeen,
        currentlyStudying: friend.currentlyStudying,
        todayMinutes,
        totalMinutes,
        totalSessions: allSessions.length,
        streak,
        medals: { gold, silver, bronze }
      };
    }));

    res.json(friendsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/friends/requests - get incoming friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .populate('friendRequests.from', 'name email username avatar');
    const pending = me.friendRequests.filter(r => r.status === 'pending');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/friends/search?q=query - search users by name/email/username
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const me = await User.findById(req.user._id);
    const friendIds = me.friends.map(f => f.toString());
    const sentIds = me.sentRequests.map(f => f.toString());

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    }).select('name email username avatar').limit(10);

    const results = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      username: u.username,
      avatar: u.avatar,
      isFriend: friendIds.includes(u._id.toString()),
      requestSent: sentIds.includes(u._id.toString()),
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/friends/request/:userId - send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user._id.toString()) return res.status(400).json({ message: "Can't add yourself" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user._id);
    if (me.friends.includes(targetId)) return res.status(400).json({ message: 'Already friends' });
    if (me.sentRequests.includes(targetId)) return res.status(400).json({ message: 'Request already sent' });

    // Check if they already sent us a request -> auto-accept
    const existingRequest = target.sentRequests.find(id => id.toString() === req.user._id.toString());
    if (existingRequest) {
      me.friends.push(targetId);
      target.friends.push(req.user._id);
      target.friendRequests = target.friendRequests.filter(r => r.from.toString() !== req.user._id.toString());
      me.friendRequests = me.friendRequests.filter(r => r.from.toString() !== targetId);
      target.sentRequests = target.sentRequests.filter(id => id.toString() !== req.user._id.toString());
      await me.save(); await target.save();
      return res.json({ message: 'Mutual request — you are now friends!', mutual: true });
    }

    target.friendRequests.push({ from: req.user._id, status: 'pending' });
    me.sentRequests.push(targetId);
    await target.save(); await me.save();

    res.json({ message: 'Friend request sent!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/friends/accept/:requestId - accept a friend request
router.post('/accept/:fromUserId', auth, async (req, res) => {
  try {
    const fromUserId = req.params.fromUserId;
    const me = await User.findById(req.user._id);
    const request = me.friendRequests.find(r => r.from.toString() === fromUserId && r.status === 'pending');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    me.friends.push(fromUserId);
    await me.save();

    const sender = await User.findById(fromUserId);
    sender.friends.push(req.user._id);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== req.user._id.toString());
    await sender.save();

    res.json({ message: 'Friend request accepted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/friends/decline/:fromUserId - decline a friend request
router.post('/decline/:fromUserId', auth, async (req, res) => {
  try {
    const fromUserId = req.params.fromUserId;
    const me = await User.findById(req.user._id);
    me.friendRequests = me.friendRequests.filter(r => r.from.toString() !== fromUserId);
    await me.save();

    const sender = await User.findById(fromUserId);
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== req.user._id.toString());
      await sender.save();
    }

    res.json({ message: 'Request declined' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/friends/:userId - remove friend
router.delete('/:userId', auth, async (req, res) => {
  try {
    const targetId = req.params.userId;
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { friends: req.user._id } });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/friends/:userId/profile - get a friend's public profile + stats
router.get('/:userId/profile', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const isFriend = me.friends.map(f => f.toString()).includes(req.params.userId);
    if (!isFriend) return res.status(403).json({ message: 'Not friends' });

    const friend = await User.findById(req.params.userId).select('-password -friendRequests -sentRequests -friends');
    const today = new Date().toISOString().split('T')[0];
    const last30 = new Date(); last30.setDate(last30.getDate() - 30);
    const last30Str = last30.toISOString().split('T')[0];

    const sessions = await StudySession.find({ user: req.params.userId, date: { $gte: last30Str } })
      .sort({ date: -1 }).populate('course', 'name color emoji');

    const todayMins = sessions.filter(s => s.date === today).reduce((a, s) => a + (s.duration || 0), 0);
    const totalSessions = await StudySession.countDocuments({ user: req.params.userId });

    // weekly breakdown
    const weeklyMap = {};
    sessions.forEach(s => {
      const d = new Date(s.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-W${weekNum}`;
      if (!weeklyMap[key]) weeklyMap[key] = 0;
      weeklyMap[key] += s.duration || 0;
    });

    res.json({ friend, sessions: sessions.slice(0, 20), todayMins, totalSessions, weeklyMap });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
