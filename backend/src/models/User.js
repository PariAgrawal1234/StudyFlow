const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  settings: {
    medalGoals: {
      bronze: { type: Number, default: 180 },
      silver: { type: Number, default: 240 },
      gold: { type: Number, default: 300 }
    },
    notifications: {
      show: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      dailyGoal: { type: Boolean, default: true },
      dailyMedals: { type: Boolean, default: true },
      streaks: { type: Boolean, default: true },
      weeklyBadges: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'dark' }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
