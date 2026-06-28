const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#6C63FF' },
  emoji: { type: String, default: '📚' },
  totalHours: { type: Number, default: 0 },
  studiedMinutes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

courseSchema.virtual('studiedHours').get(function () {
  return Math.floor(this.studiedMinutes / 60);
});

courseSchema.virtual('progressPercent').get(function () {
  if (!this.totalHours) return 0;
  return Math.min(100, Math.round((this.studiedMinutes / (this.totalHours * 60)) * 100));
});

module.exports = mongoose.model('Course', courseSchema);
