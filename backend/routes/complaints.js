const express = require('express');
const router = express.Router();
const multer = require('multer');
const Complaint = require('../models/Complaint');
const { userAuth, adminAuth } = require('../middleware/auth');
const {
  transcribeVoice,
  classifyComplaint,
  generateTrackingId,
  sendWhatsApp,
  statusUpdateMessage,
} = require('../utils/whatsapp');

// Multer config for voice uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ── FILE COMPLAINT (Web Channel) ───────────────────────────────────────────

/**
 * POST /api/complaints/file
 * Auth: User JWT
 * Body (multipart): { text?, state, district, city, lat?, lng? } + optional audio file
 */
router.post('/file', userAuth, upload.single('audio'), async (req, res) => {
  try {
    const { text, state, district, city, lat, lng } = req.body;
    let complaintText = text || '';

    // If audio uploaded, transcribe it with Deepgram (Free Tier)
    if (req.file) {
      try {
        const { createClient } = require('@deepgram/sdk');
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY || 'MISSING_KEY');
        
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
          req.file.buffer,
          {
            model: 'nova-2',
            smart_format: true,
            detect_language: true,
          }
        );

        if (error) throw error;
        
        complaintText = result?.results?.channels[0]?.alternatives[0]?.transcript || '';
        if (!complaintText) throw new Error('Empty transcript returned');
        
      } catch (dgErr) {
        console.error('Deepgram Transcription failed:', dgErr.message || dgErr);
        complaintText = "Audio complaint submitted.";
      }
    }

    if (!complaintText.trim()) {
      return res.status(400).json({ error: 'Complaint text or audio required' });
    }

    // AI Classification
    const ai = await classifyComplaint(complaintText, req.user.preferred_language);

    // Build complaint
    const complaint = new Complaint({
      tracking_id: generateTrackingId(),
      user_id: req.user._id,
      phone: req.user.phone,
      channel: 'web',
      raw_text: complaintText,
      input_language: req.user.preferred_language,
      summary_en: ai.summary_en,
      department: ai.department,
      severity: ai.severity,
      eta_days: ai.eta_days,
      state: state || ai.state || '',
      district: district || ai.district || '',
      city: city || '',
      lat: lat ? parseFloat(lat) : ai.lat,
      lng: lng ? parseFloat(lng) : ai.lng,
      status: 'Registered',
      status_history: [{ status: 'Registered', timestamp: new Date() }],
      filed_at: new Date(),
    });

    await complaint.save();

    // Notify admin via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`admin_${complaint.state}`).emit('new_complaint', complaint);
      io.to('admin_super').emit('new_complaint', complaint);
    }

    res.status(201).json({
      message: 'Complaint registered successfully',
      tracking_id: complaint.tracking_id,
      complaint: {
        tracking_id: complaint.tracking_id,
        department: complaint.department,
        severity: complaint.severity,
        summary_en: complaint.summary_en,
        eta_days: complaint.eta_days,
        status: complaint.status,
        filed_at: complaint.filed_at,
      },
    });
  } catch (err) {
    console.error('File complaint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── TRACK COMPLAINT (Public) ───────────────────────────────────────────────

/**
 * GET /api/complaints/track/:trackingId
 * Auth: None (public)
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      tracking_id: req.params.trackingId,
    }).select('-__v -user_id');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check and update SLA breach
    const slaBreached = complaint.checkSLA();
    if (slaBreached !== complaint.sla_breach) {
      complaint.sla_breach = slaBreached;
      await complaint.save();
    }

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET MY COMPLAINTS (User) ───────────────────────────────────────────────

/**
 * GET /api/complaints/my
 * Auth: User JWT
 */
router.get('/my', userAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user_id: req.user._id })
      .sort({ filed_at: -1 })
      .select('tracking_id department severity status summary_en filed_at sla_breach');

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET COMPLAINTS (Admin) ─────────────────────────────────────────────────

/**
 * GET /api/complaints
 * Auth: Admin JWT
 * Query: state?, district?, department?, severity?, status?, page?, limit?
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      state,
      district,
      department,
      severity,
      status,
      page = 1,
      limit = 20,
      sla_breach,
    } = req.query;

    const filter = {};

    // State admins can only see their state
    if (req.admin.role === 'state_admin') {
      filter.state = req.admin.state;
    } else if (state) {
      filter.state = state;
    }

    if (district) filter.district = district;
    if (department) filter.department = department;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (sla_breach === 'true') filter.sla_breach = true;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ filed_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    res.json({
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE STATUS (Admin) ──────────────────────────────────────────────────

/**
 * PATCH /api/complaints/:id/status
 * Auth: Admin JWT
 * Body: { status, note? }
 */
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Registered', 'Under Review', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // State admin can only update complaints in their state
    if (req.admin.role === 'state_admin' && complaint.state !== req.admin.state) {
      return res.status(403).json({ error: 'Access denied' });
    }

    complaint.status = status;
    complaint.status_history.push({
      status,
      updated_by: req.admin._id,
      note: note || '',
      timestamp: new Date(),
    });

    if (status === 'Resolved') {
      complaint.resolved_at = new Date();
      complaint.sla_breach = false;
    }

    await complaint.save();

    // Emit live update to tracking page
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint_${complaint.tracking_id}`).emit('status_update', {
        tracking_id: complaint.tracking_id,
        status: complaint.status,
        status_history: complaint.status_history,
      });
      io.to(`admin_${complaint.state}`).emit('complaint_updated', complaint);
      io.to('admin_super').emit('complaint_updated', complaint);
    }

    // Send WhatsApp notification to user
    if (complaint.phone) {
      try {
        await sendWhatsApp(complaint.phone, statusUpdateMessage(complaint));
      } catch (notifErr) {
        console.error('WhatsApp notification failed:', notifErr.message);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({ message: 'Status updated', complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET MAP DATA (Admin — for heatmap) ────────────────────────────────────

/**
 * GET /api/complaints/map
 * Auth: Admin JWT
 * Returns aggregated complaint counts per district
 */
router.get('/map/data', adminAuth, async (req, res) => {
  try {
    const { state } = req.query;
    const matchState = req.admin.role === 'state_admin' ? req.admin.state : state;

    const filter = {};
    if (matchState) filter.state = matchState;

    const data = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { state: '$state', district: '$district' },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] } },
          sla_breaches: { $sum: { $cond: ['$sla_breach', 1, 0] } },
          lat: { $avg: '$lat' },
          lng: { $avg: '$lng' },
        },
      },
      {
        $project: {
          state: '$_id.state',
          district: '$_id.district',
          count: 1,
          resolved: 1,
          critical: 1,
          sla_breaches: 1,
          lat: 1,
          lng: 1,
          resolve_pct: {
            $multiply: [{ $divide: ['$resolved', '$count'] }, 100],
          },
        },
      },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
