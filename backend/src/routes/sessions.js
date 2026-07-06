const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudySession = require('../models/StudySession');
const Course = require('../models/Course');

// @route POST /api/sessions/start
router.post('/start', auth, async (req, res) => {
  try {
    const { courseId, timerType } = req.body;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    let courseName = 'General';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) courseName = course.name;
    }

    const session = new StudySession({
      user: req.user._id,
      course: courseId || null,
      courseName,
      startTime: now,
      timerType: timerType || 'stopwatch',
      date: dateStr
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route PUT /api/sessions/:id/end
router.put('/:id/end', auth, async (req, res) => {
  try {
    const { notes, duration: clientDuration } = req.body;
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const endTime = new Date();
    // Use client-supplied duration (which excludes Pomodoro break time) if provided.
    // Fall back to wall-clock difference only for stopwatch sessions where they match.
    const wallDuration = Math.round((endTime - session.startTime) / 60000);
    const duration = (clientDuration != null && clientDuration > 0)
      ? Math.round(clientDuration / 60) // client sends seconds, convert to minutes
      : wallDuration;

    session.endTime = endTime;
    session.duration = duration;
    session.notes = notes || '';
    await session.save();

    // Update course studied minutes
    if (session.course) {
      await Course.findByIdAndUpdate(session.course, { $inc: { studiedMinutes: duration } });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/sessions (manual entry)
router.post('/', auth, async (req, res) => {
  try {
    const { courseId, startTime, endTime, duration, notes, timerType } = req.body;
    const start = new Date(startTime);
    const dateStr = start.toISOString().split('T')[0];

    let courseName = 'General';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) courseName = course.name;
    }

    const session = new StudySession({
      user: req.user._id,
      course: courseId || null,
      courseName,
      startTime: start,
      endTime: endTime ? new Date(endTime) : null,
      duration: duration || 0,
      notes: notes || '',
      timerType: timerType || 'stopwatch',
      date: dateStr
    });
    await session.save();

    if (courseId && duration) {
      await Course.findByIdAndUpdate(courseId, { $inc: { studiedMinutes: duration } });
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/sessions
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1, date, course } = req.query;
    const query = { user: req.user._id };
    if (date) query.date = date;
    if (course) query.course = course;

    const sessions = await StudySession.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('course', 'name color');

    const total = await StudySession.countDocuments(query);
    res.json({ sessions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/sessions/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { user: req.user._id };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const sessions = await StudySession.find(query);
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalSessions = sessions.length;

    // Daily breakdown
    const dailyMap = {};
    sessions.forEach(s => {
      if (!dailyMap[s.date]) dailyMap[s.date] = { minutes: 0, sessions: 0 };
      dailyMap[s.date].minutes += s.duration || 0;
      dailyMap[s.date].sessions += 1;
    });

    // Weekly breakdown
    const weeklyMap = {};
    sessions.forEach(s => {
      const d = new Date(s.date);
      const week = getWeekNumber(d);
      const key = `${d.getFullYear()}-W${week}`;
      if (!weeklyMap[key]) weeklyMap[key] = { minutes: 0, sessions: 0, week, year: d.getFullYear() };
      weeklyMap[key].minutes += s.duration || 0;
      weeklyMap[key].sessions += 1;
    });

    // Course breakdown
    const courseMap = {};
    sessions.forEach(s => {
      const key = s.courseName || 'General';
      if (!courseMap[key]) courseMap[key] = { minutes: 0, sessions: 0, courseId: s.course };
      courseMap[key].minutes += s.duration || 0;
      courseMap[key].sessions += 1;
    });

    // Day of week analysis
    const dowMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dowCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    sessions.forEach(s => {
      const dow = new Date(s.date).getDay();
      dowMap[dow] += s.duration || 0;
      dowCount[dow] += 1;
    });

    res.json({
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      totalSessions,
      dailyBreakdown: dailyMap,
      weeklyBreakdown: weeklyMap,
      courseBreakdown: courseMap,
      dayOfWeekAvg: Object.keys(dowMap).map(k => ({
        day: parseInt(k),
        totalMinutes: dowMap[k],
        avgMinutes: dowCount[k] ? Math.round(dowMap[k] / dowCount[k]) : 0,
        count: dowCount[k]
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/sessions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.course && session.duration) {
      await Course.findByIdAndUpdate(session.course, { $inc: { studiedMinutes: -session.duration } });
    }
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;