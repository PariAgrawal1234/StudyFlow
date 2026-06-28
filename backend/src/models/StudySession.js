const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  courseName: { type: String, default: 'General' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in minutes
  timerType: { type: String, enum: ['stopwatch', 'pomodoro'], default: 'stopwatch' },
  notes: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD for easy querying
  createdAt: { type: Date, default: Date.now }
});

studySessionSchema.index({ user: 1, date: 1 });
studySessionSchema.index({ user: 1, course: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
