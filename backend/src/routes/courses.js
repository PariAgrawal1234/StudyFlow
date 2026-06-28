const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');

// @route GET /api/courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id, isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/courses
router.post('/', auth, async (req, res) => {
  try {
    const { name, color, emoji, totalHours } = req.body;
    const count = await Course.countDocuments({ user: req.user._id });
    const course = new Course({
      user: req.user._id,
      name, color: color || '#6C63FF',
      emoji: emoji || '📚',
      totalHours: totalHours || 0,
      order: count
    });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route PUT /api/courses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/courses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
