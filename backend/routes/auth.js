const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { userAuth } = require('../middleware/auth');
const { sendWhatsApp } = require('../utils/whatsapp');

// ── Generate OTP ───────────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── USER AUTH ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 * Sends OTP to phone (in prod: via Twilio Verify. For hackathon: return OTP in response)
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
    }
    user.otp = { code: otp, expires_at };
    await user.save();

    // Send OTP via WhatsApp (Twilio)
    await sendWhatsApp(
      phone,
      `🔐 *Your CivicAI OTP is: ${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.\n\n_CivicAI — Urban Grievance Platform_`
    );

    console.log(`OTP sent via WhatsApp to ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent to your WhatsApp',
      // REMOVE in production — only for hackathon demo:
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp, name? }
 * Returns JWT token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'User not found. Send OTP first.' });

    if (!user.otp || user.otp.code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    if (new Date() > user.otp.expires_at) {
      return res.status(401).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Update name if provided (first time)
    if (name && !user.name) user.name = name;
    user.otp = undefined; // Clear OTP after use
    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { _id: user._id, phone: user.phone, name: user.name, preferred_language: user.preferred_language },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns current user from JWT
 */
router.get('/me', userAuth, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      phone: req.user.phone,
      name: req.user.name,
      preferred_language: req.user.preferred_language,
    },
  });
});

/**
 * PATCH /api/auth/profile
 * Update user name and preferred language
 */
router.patch('/profile', userAuth, async (req, res) => {
  try {
    const { name, preferred_language } = req.body;
    if (name) req.user.name = name;
    if (preferred_language) req.user.preferred_language = preferred_language;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN AUTH ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Body: { email, password }
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await admin.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, state: admin.state, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        state: admin.state,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/admin/seed
 * One-time route to create super admin (disable after use)
 * Body: { secret, name, email, password }
 */
router.post('/admin/seed', async (req, res) => {
  try {
    const { secret, name, email, password } = req.body;
    if (secret !== 'CIVICAI_SEED_2024') return res.status(403).json({ error: 'Forbidden' });

    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Admin already exists' });

    const admin = new Admin({
      name,
      email,
      password_hash: password,
      role: 'super_admin',
      state: null,
    });
    await admin.save();

    res.json({ message: 'Super admin created', email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
