const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetHours: { type: Number, default: 0 },
  targetSessions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['semester', 'monthly', 'weekly', 'custom'], default: 'custom' },
  color: { type: String, default: '#6C63FF' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema);
