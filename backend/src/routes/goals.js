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
      try {
        // Guard against legacy/corrupted goals with missing or invalid dates
        if (!goal.startDate || !goal.endDate || isNaN(goal.startDate.getTime()) || isNaN(goal.endDate.getTime())) {
          return null;
        }

        const fromDate = goal.startDate.toISOString().split('T')[0];
        const toDate = goal.endDate.toISOString().split('T')[0];

        const sessions = await StudySession.find({
          user: req.user._id,
          date: { $gte: fromDate, $lte: toDate }
        });

        const studiedMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalStudyDays = [...new Set(sessions.map(s => s.date))].length;
        const targetHours = goal.targetHours || 0;
        const daysTotal = Math.max(1, Math.ceil((goal.endDate - goal.startDate) / (1000 * 60 * 60 * 24)) + 1);
        const daysPassed = Math.max(1, Math.ceil((new Date(today) - goal.startDate) / (1000 * 60 * 60 * 24)) + 1);
        const daysRemaining = Math.max(0, daysTotal - daysPassed);
        const studyProgressPercent = targetHours ? Math.min(100, Math.round((studiedMinutes / (targetHours * 60)) * 100)) : 0;
        const requiredPaceMinPerDay = daysRemaining > 0 ? Math.max(0, Math.ceil(((targetHours * 60) - studiedMinutes) / daysRemaining)) : 0;

        return {
          goal: goal.toObject(),
          studiedMinutes,
          studiedHours: Math.floor(studiedMinutes / 60),
          totalSessions: sessions.length,
          totalStudyDays,
          studyDays: totalStudyDays,
          progressPercent: studyProgressPercent,
          studyProgressPercent,
          daysTotal,
          daysPassed,
          daysRemaining,
          requiredPaceMinPerDay,
          timeElapsedPercent: Math.round((daysPassed / daysTotal) * 100)
        };
      } catch (innerErr) {
        console.error('Skipping corrupted goal', goal._id, innerErr.message);
        return null;
      }
    }));

    // Filter out any goals that failed to process instead of crashing the whole request
    res.json(goalsWithProgress.filter(Boolean));
  } catch (err) {
    console.error('GET /goals/active error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/goals
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, targetHours, targetSessions, color } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!startDate || !endDate) return res.status(400).json({ message: 'Start and end dates are required' });

    const goal = new Goal({
      user: req.user._id,
      title: title.trim(),
      description: description || '',
      type: type || 'custom',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetHours: targetHours === '' || targetHours == null ? 0 : Number(targetHours),
      targetSessions: targetSessions === '' || targetSessions == null ? 0 : Number(targetSessions),
      color: color || '#5BA4CF'
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, targetHours, targetSessions, color, isActive } = req.body;
    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description;
    if (type !== undefined) update.type = type;
    if (startDate !== undefined) update.startDate = new Date(startDate);
    if (endDate !== undefined) update.endDate = new Date(endDate);
    if (targetHours !== undefined) update.targetHours = targetHours === '' ? 0 : Number(targetHours);
    if (targetSessions !== undefined) update.targetSessions = targetSessions === '' ? 0 : Number(targetSessions);
    if (color !== undefined) update.color = color;
    if (isActive !== undefined) update.isActive = isActive;

    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update, { new: true, runValidators: true });
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