const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudySession = require('../models/StudySession');
const Goal = require('../models/Goal');
const Course = require('../models/Course');

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Today's sessions
    const todaySessions = await StudySession.find({ user: req.user._id, date: today });
    const todayMinutes = todaySessions.reduce((s, sess) => s + (sess.duration || 0), 0);

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekSessions = await StudySession.find({ user: req.user._id, date: { $gte: weekStartStr, $lte: today } });
    const weekMinutes = weekSessions.reduce((s, sess) => s + (sess.duration || 0), 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthSessions = await StudySession.find({ user: req.user._id, date: { $gte: monthStart, $lte: today } });
    const monthMinutes = monthSessions.reduce((s, sess) => s + (sess.duration || 0), 0);

    // Total
    const allSessions = await StudySession.find({ user: req.user._id });
    const totalMinutes = allSessions.reduce((s, sess) => s + (sess.duration || 0), 0);
    const totalSessions = allSessions.length;

    // Active goal
    const activeGoal = await Goal.findOne({ user: req.user._id, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).sort({ createdAt: -1 });

    let goalProgress = null;
    if (activeGoal) {
      const fromDate = activeGoal.startDate.toISOString().split('T')[0];
      const toDate = activeGoal.endDate.toISOString().split('T')[0];
      const goalSessions = await StudySession.find({ user: req.user._id, date: { $gte: fromDate, $lte: toDate } });
      const goalMinutes = goalSessions.reduce((s, sess) => s + (sess.duration || 0), 0);
      const studyDays = [...new Set(goalSessions.map(s => s.date))].length;
      const daysTotal = Math.ceil((activeGoal.endDate - activeGoal.startDate) / 86400000) + 1;
      const daysPassed = Math.ceil((now - activeGoal.startDate) / 86400000) + 1;
      const daysRemaining = Math.max(0, daysTotal - daysPassed);
      const requiredMinutesPerDay = daysRemaining > 0 ? Math.ceil(((activeGoal.targetHours * 60) - goalMinutes) / daysRemaining) : 0;

      goalProgress = {
        goal: activeGoal,
        studiedMinutes: goalMinutes,
        totalSessions: goalSessions.length,
        studyDays,
        daysTotal,
        daysPassed,
        daysRemaining,
        timeElapsedPercent: Math.round((daysPassed / daysTotal) * 100),
        studyProgressPercent: activeGoal.targetHours ? Math.round((goalMinutes / (activeGoal.targetHours * 60)) * 100) : 0,
        activeDays: studyDays,
        activeDaysOver100: goalSessions.filter ? 0 : 0,
        avgDailyActive: studyDays > 0 ? Math.round(goalMinutes / studyDays) : 0,
        avgDailyAll: daysPassed > 0 ? Math.round(goalMinutes / daysPassed) : 0,
        currentPaceMinPerDay: daysPassed > 0 ? Math.round(goalMinutes / daysPassed) : 0,
        requiredPaceMinPerDay: requiredMinutesPerDay
      };
    }

    // Streak
    const sortedDates = [...new Set(allSessions.map(s => s.date))].sort().reverse();
    let streak = 0;
    let checkDate = new Date(today);
    for (const d of sortedDates) {
      const check = checkDate.toISOString().split('T')[0];
      if (d === check) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    // Last 7 days for streak display
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessionMinutes = allSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + (s.duration || 0), 0);
      last7Days.push({ date: dateStr, minutes: daySessionMinutes, hasStudied: daySessionMinutes > 0 });
    }

    // Medal check
    const { medalGoals } = req.user.settings || { medalGoals: { bronze: 180, silver: 240, gold: 300 } };
    const todayMedal = todayMinutes >= medalGoals.gold ? 'gold' : todayMinutes >= medalGoals.silver ? 'silver' : todayMinutes >= medalGoals.bronze ? 'bronze' : null;

    // Medals per period (last 30 days)
    const last30Start = new Date(now);
    last30Start.setDate(last30Start.getDate() - 30);
    const last30Str = last30Start.toISOString().split('T')[0];
    const last30Sessions = await StudySession.find({ user: req.user._id, date: { $gte: last30Str, $lte: today } });

    const dailyMinutes30 = {};
    last30Sessions.forEach(s => {
      if (!dailyMinutes30[s.date]) dailyMinutes30[s.date] = 0;
      dailyMinutes30[s.date] += s.duration || 0;
    });

    let goldMedals = 0, silverMedals = 0, bronzeMedals = 0;
    Object.values(dailyMinutes30).forEach(mins => {
      if (mins >= medalGoals.gold) goldMedals++;
      else if (mins >= medalGoals.silver) silverMedals++;
      else if (mins >= medalGoals.bronze) bronzeMedals++;
    });

    // Courses
    const courses = await Course.find({ user: req.user._id, isActive: true }).sort({ order: 1 });

    // Share price (cumulative minutes per day for last 30 days)
    const sharePriceData = [];
    let cumulative = 0;
    const daysBefore30 = await StudySession.find({ user: req.user._id, date: { $lt: last30Str } });
    cumulative = daysBefore30.reduce((s, sess) => s + (sess.duration || 0), 0) / 60;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayMins = dailyMinutes30[dateStr] || 0;
      cumulative += dayMins / 60;
      sharePriceData.push({ date: dateStr, value: Math.round(cumulative * 10) / 10 });
    }

    res.json({
      today: { minutes: todayMinutes, sessions: todaySessions.length },
      week: { minutes: weekMinutes, sessions: weekSessions.length },
      month: { minutes: monthMinutes, sessions: monthSessions.length },
      total: { minutes: totalMinutes, sessions: totalSessions },
      streak,
      last7Days,
      goalProgress,
      medals: { gold: goldMedals, silver: silverMedals, bronze: bronzeMedals, today: todayMedal },
      courses,
      sharePriceData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
