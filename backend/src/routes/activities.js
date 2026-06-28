const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const activity = new Activity({ user: req.user._id, ...req.body });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Activity.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
