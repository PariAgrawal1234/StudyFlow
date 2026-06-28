const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const StudySession = require('../models/StudySession');

// @route GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/goals/active
router.get('/active', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const goals = await Goal.find({ user: req.user._id, isActive: true, startDate: { $lte: new Date(today) }, endDate: { $gte: new Date(today) } });

    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      const fromDate = goal.startDate.toISOString().split('T')[0];
      const toDate = goal.endDate.toISOString().split('T')[0];

      const sessions = await StudySession.find({
        user: req.user._id,
        date: { $gte: fromDate, $lte: toDate }
      });

      const studiedMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalStudyDays = [...new Set(sessions.map(s => s.date))].length;

      return {
        ...goal.toObject(),
        studiedMinutes,
        studiedHours: Math.floor(studiedMinutes / 60),
        totalSessions: sessions.length,
        totalStudyDays,
        progressPercent: goal.targetHours ? Math.min(100, Math.round((studiedMinutes / (goal.targetHours * 60)) * 100)) : 0,
        daysTotal: Math.ceil((goal.endDate - goal.startDate) / (1000 * 60 * 60 * 24)) + 1,
        daysPassed: Math.ceil((new Date(today) - goal.startDate) / (1000 * 60 * 60 * 24)) + 1,
        timeElapsedPercent: 0
      };
    }));

    goalsWithProgress.forEach(g => {
      g.timeElapsedPercent = g.daysTotal ? Math.round((g.daysPassed / g.daysTotal) * 100) : 0;
    });

    res.json(goalsWithProgress);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/goals
router.post('/', auth, async (req, res) => {
  try {
    const goal = new Goal({ user: req.user._id, ...req.body });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
