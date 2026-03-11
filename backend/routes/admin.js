const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const { adminAuth, superAdminAuth } = require('../middleware/auth');

// ── NATIONAL STATS (Super Admin) ───────────────────────────────────────────

/**
 * GET /api/admin/stats/national
 * Auth: Super Admin
 */
router.get('/stats/national', superAdminAuth, async (req, res) => {
  try {
    const [totalComplaints, resolvedComplaints, slaBreach, deptBreakdown, stateStats] =
      await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'Resolved' }),
        Complaint.countDocuments({ sla_breach: true }),
        Complaint.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate([
          {
            $group: {
              _id: '$state',
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
              sla_breaches: { $sum: { $cond: ['$sla_breach', 1, 0] } },
              avg_resolve_ms: {
                $avg: {
                  $cond: [
                    { $ne: ['$resolved_at', null] },
                    { $subtract: ['$resolved_at', '$filed_at'] },
                    null,
                  ],
                },
              },
            },
          },
          {
            $project: {
              state: '$_id',
              total: 1,
              resolved: 1,
              sla_breaches: 1,
              resolve_pct: {
                $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 1],
              },
              avg_resolve_days: {
                $round: [{ $divide: [{ $ifNull: ['$avg_resolve_ms', 0] }, 86400000] }, 1],
              },
            },
          },
          { $sort: { total: -1 } },
        ]),
      ]);

    // Compute scores and rankings
    const rankedStates = stateStats.map((s) => {
      const speedScore = s.avg_resolve_days > 0 ? Math.max(0, 10 - s.avg_resolve_days) / 10 : 0;
      const breachPenalty = s.total > 0 ? s.sla_breaches / s.total : 0;
      const score = Math.round(
        (s.resolve_pct / 100) * 50 + speedScore * 30 - breachPenalty * 20
      );
      const rating =
        score >= 70 ? '🟢 Excellent' : score >= 50 ? '🟡 Average' : '🔴 Poor';
      return { ...s, score: Math.max(0, score), rating };
    });
    rankedStates.sort((a, b) => b.score - a.score);

    const avgResolveDays =
      await Complaint.aggregate([
        { $match: { resolved_at: { $ne: null } } },
        {
          $group: {
            _id: null,
            avg: { $avg: { $subtract: ['$resolved_at', '$filed_at'] } },
          },
        },
      ]);

    res.json({
      stats: {
        total_complaints: totalComplaints,
        resolved_complaints: resolvedComplaints,
        resolve_pct:
          totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0,
        sla_breaches: slaBreach,
        avg_resolve_days:
          avgResolveDays.length > 0
            ? Math.round(avgResolveDays[0].avg / 86400000 * 10) / 10
            : 0,
      },
      department_breakdown: deptBreakdown,
      state_stats: rankedStates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STATE STATS (State Admin or Super Admin) ───────────────────────────────

/**
 * GET /api/admin/stats/state/:state
 * Auth: Admin JWT
 */
router.get('/stats/state/:state', adminAuth, async (req, res) => {
  try {
    const { state } = req.params;

    // State admin can only see their own state
    if (req.admin.role === 'state_admin' && req.admin.state !== state) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [total, resolved, slaBreach, deptBreakdown, severityBreakdown, recentTrend] =
      await Promise.all([
        Complaint.countDocuments({ state }),
        Complaint.countDocuments({ state, status: 'Resolved' }),
        Complaint.countDocuments({ state, sla_breach: true }),
        Complaint.aggregate([
          { $match: { state } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate([
          { $match: { state } },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
        ]),
        // Last 7 days trend
        Complaint.aggregate([
          {
            $match: {
              state,
              filed_at: { $gte: new Date(Date.now() - 7 * 24 * 3600000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$filed_at' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      state,
      stats: {
        total,
        resolved,
        resolve_pct: total > 0 ? Math.round((resolved / total) * 100) : 0,
        sla_breaches: slaBreach,
        pending: total - resolved,
      },
      department_breakdown: deptBreakdown,
      severity_breakdown: severityBreakdown,
      recent_trend: recentTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LEADERBOARD (Super Admin) ──────────────────────────────────────────────

/**
 * GET /api/admin/leaderboard
 * Auth: Super Admin
 */
router.get('/leaderboard', superAdminAuth, async (req, res) => {
  try {
    const stateStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$state',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          sla_breaches: { $sum: { $cond: ['$sla_breach', 1, 0] } },
          avg_resolve_ms: {
            $avg: {
              $cond: [
                { $ne: ['$resolved_at', null] },
                { $subtract: ['$resolved_at', '$filed_at'] },
                null,
              ],
            },
          },
        },
      },
    ]);

    const leaderboard = stateStats
      .filter((s) => s._id) // filter out empty state
      .map((s) => {
        const resolve_pct = s.total > 0 ? (s.resolved / s.total) * 100 : 0;
        const speedScore =
          s.avg_resolve_ms > 0
            ? Math.max(0, 10 - s.avg_resolve_ms / 86400000) / 10
            : 0;
        const breachPenalty = s.total > 0 ? s.sla_breaches / s.total : 0;
        const score = Math.max(
          0,
          Math.round(resolve_pct * 0.5 + speedScore * 100 * 0.3 - breachPenalty * 100 * 0.2)
        );
        const avg_resolve_days =
          s.avg_resolve_ms > 0 ? Math.round((s.avg_resolve_ms / 86400000) * 10) / 10 : null;

        return {
          state: s._id,
          total: s.total,
          resolved: s.resolved,
          resolve_pct: Math.round(resolve_pct * 10) / 10,
          sla_breaches: s.sla_breaches,
          avg_resolve_days,
          score,
          rating: score >= 70 ? 'Excellent' : score >= 50 ? 'Average' : 'Poor',
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE ADMIN (Super Admin) ─────────────────────────────────────────────

/**
 * POST /api/admin/create
 * Auth: Super Admin
 * Body: { name, email, password, role, state? }
 */
router.post('/create', superAdminAuth, async (req, res) => {
  try {
    const { name, email, password, role, state } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role required' });
    }
    if (role === 'state_admin' && !state) {
      return res.status(400).json({ error: 'state required for state_admin' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Admin with this email already exists' });

    const admin = new Admin({ name, email, password_hash: password, role, state: state || null });
    await admin.save();

    res.status(201).json({
      message: 'Admin created',
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role, state: admin.state },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/list
 * Auth: Super Admin
 */
router.get('/list', superAdminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password_hash -__v').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/:id
 * Auth: Super Admin
 */
router.delete('/:id', superAdminAuth, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
