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

const path = require('path');
const fs = require('fs');

// Ensure upload dir exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config — disk storage so files persist
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('webm') ? '.webm' : '.jpg');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp4', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    cb(null, allowed.some(t => file.mimetype.startsWith(t.split('/')[0])));
  },
});

// Accept: audio field + up to 5 image fields
const uploadFields = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

// ── FILE COMPLAINT (Web Channel) ───────────────────────────────────────────

/**
 * POST /api/complaints/file
 * Auth: User JWT
 * Body (multipart): { text?, state, district, city, lat?, lng? } + optional audio file
 */
router.post('/file', userAuth, uploadFields, async (req, res) => {
  try {
    const { text, state, district, city, lat, lng } = req.body;
    let complaintText = text || '';

    // If audio uploaded, transcribe it with Deepgram (Free Tier)
    const audioFile = req.files?.audio?.[0];
    if (audioFile) {
      try {
        const { createClient } = require('@deepgram/sdk');
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY || 'MISSING_KEY');
        
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
          fs.readFileSync(audioFile.path),
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

    // Build image URLs and pair with metadata
    const imageFiles = req.files?.images || [];
    const imageMetadataMap = {};
    if (req.body.image_metadata) {
      try {
        const metadata = JSON.parse(req.body.image_metadata);
        metadata.forEach((m) => {
          imageMetadataMap[m.fileName] = { lat: m.lat, lng: m.lng };
        });
      } catch (e) {
        console.error('Error parsing image_metadata:', e);
      }
    }

    const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
    const images = imageFiles.map((f) => ({
      url: `${BASE}/uploads/${f.filename}`,
      lat: imageMetadataMap[f.originalname]?.lat || null,
      lng: imageMetadataMap[f.originalname]?.lng || null,
    }));

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
      country: req.body.country || 'India',
      lat: lat ? parseFloat(lat) : ai.lat,
      lng: lng ? parseFloat(lng) : ai.lng,
      status: 'Registered',
      status_history: [{ status: 'Registered', timestamp: new Date() }],
      filed_at: new Date(),
      images,
    });

    // DUPLICATE MERGING LOGIC
    // Find open complaints in the same district and department
    const duplicate = await Complaint.findOne({
      district: complaint.district,
      department: complaint.department,
      status: { $ne: 'Resolved' },
      $or: [{ is_master: true }, { master_id: null }],
    });

    if (duplicate) {
      // If we found a candidate, link to its master or make it master
      if (duplicate.is_master) {
        complaint.master_id = duplicate._id;
      } else {
        // Promote the existing one to master and link both
        duplicate.is_master = true;
        await duplicate.save();
        complaint.master_id = duplicate._id;
      }
      console.log(`Linked complaint ${complaint.tracking_id} to master ${duplicate.tracking_id}`);
    }

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

    // Sort by severity priority: Critical > High > Medium > Low
    const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    complaints.sort((a, b) => {
      const sevDiff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.filed_at) - new Date(a.filed_at);
    });

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

    const pipeline = [];

    // Filter stage
    const match = { master_id: null }; // Only show top-level or orphans

    if (req.admin.role === 'state_admin') {
      match.state = { $regex: new RegExp(`^${req.admin.state}$`, 'i') };
    } else if (state) {
      match.state = { $regex: new RegExp(`^${state}$`, 'i') };
    }

    if (district) match.district = { $regex: new RegExp(district, 'i') };
    if (department) match.department = department;
    if (severity) match.severity = severity;
    if (status) match.status = status;
    if (sla_breach === 'true') match.sla_breach = true;

    pipeline.push({ $match: match });

    // Join with children to get duplicate count
    pipeline.push({
      $lookup: {
        from: 'complaints',
        localField: '_id',
        foreignField: 'master_id',
        as: 'children',
      },
    });

    pipeline.push({
      $addFields: {
        duplicate_count: { $size: '$children' },
      },
    });

    // Pagination/Sort
    pipeline.push({ $sort: { filed_at: -1 } });
    
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countRes = await Complaint.aggregate(countPipeline);
    const total = countRes.length > 0 ? countRes[0].total : 0;

    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });
    pipeline.push({ $project: { children: 0, __v: 0 } });

    const complaints = await Complaint.aggregate(pipeline);

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
    if (req.admin.role === 'state_admin' && complaint.state !== req.admin.state && complaint.state.toLowerCase() !== req.admin.state.toLowerCase()) {
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

    // DUPLICATE PROPAGATION LOGIC
    if (complaint.is_master) {
      const children = await Complaint.find({ master_id: complaint._id });
      for (const child of children) {
        child.status = status;
        child.status_history.push({
          status,
          updated_by: req.admin._id,
          note: note || '',
          timestamp: new Date(),
        });
        if (status === 'Resolved') {
          child.resolved_at = new Date();
          child.sla_breach = false;
        }
        await child.save();

        // Notify child user via WhatsApp
        if (child.phone) {
          try {
            await sendWhatsApp(child.phone, statusUpdateMessage(child));
          } catch (notifErr) {
            console.error(`WhatsApp notification failed for child ${child.tracking_id}:`, notifErr.message);
          }
        }

        // Emit live update for child tracking page
        if (io) {
          io.to(`complaint_${child.tracking_id}`).emit('status_update', {
            tracking_id: child.tracking_id,
            status: child.status,
            status_history: child.status_history,
          });
        }
      }
      console.log(`Propagated status ${status} to ${children.length} child complaints`);
    }

    // Emit live update to tracking page and dashboards
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
 * Returns raw complaint data for individual markers
 */
router.get('/map/data', adminAuth, async (req, res) => {
  try {
    const { state } = req.query;
    const matchState = req.admin.role === 'state_admin' ? req.admin.state : state;

    const filter = {};
    if (matchState) filter.state = { $regex: new RegExp(`^${matchState}$`, 'i') };

    const data = await Complaint.aggregate([
      { $match: filter },
      {
        $project: {
          tracking_id: 1,
          state: 1,
          district: 1,
          status: 1,
          severity: 1,
          sla_breach: 1,
          lat: 1,
          lng: 1,
          department: 1,
          summary_en: 1,
        },
      },
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
