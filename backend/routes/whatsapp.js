const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const {
  sendWhatsApp,
  transcribeVoice,
  classifyComplaint,
  generateTrackingId,
} = require('../utils/whatsapp');

// In-memory session store (use Redis in production)
const userSessions = {};

const LANGUAGE_MAP = {
  '1': { code: 'en', name: 'English' },
  '2': { code: 'hi', name: 'Hindi' },
  '3': { code: 'mr', name: 'Marathi' },
  '4': { code: 'ta', name: 'Tamil' },
  '5': { code: 'te', name: 'Telugu' },
  '6': { code: 'bn', name: 'Bengali' },
  '7': { code: 'gu', name: 'Gujarati' },
  '8': { code: 'kn', name: 'Kannada' },
};

const GREET_MESSAGE = `🏙️ *Welcome to CivicAI!*

Your municipal grievance assistant. I'll help you file a complaint in your language.

Please choose your preferred language:
1️⃣ English
2️⃣ Hindi (हिंदी)
3️⃣ Marathi (मराठी)
4️⃣ Tamil (தமிழ்)
5️⃣ Telugu (తెలుగు)
6️⃣ Bengali (বাংলা)
7️⃣ Gujarati (ગુજરાતી)
8️⃣ Kannada (ಕನ್ನಡ)

_Reply with a number (1-8)_`;

const COMPLAINT_PROMPT = (langName) =>
  `✅ Got it! Language set to *${langName}*.

Please describe your complaint now. You can:
📝 *Type* your complaint, OR
🎤 *Send a voice note*

Tell me what the issue is, where it is, and any other details.`;

const LOCATION_PROMPT = `📍 *Almost done!*

Please tell me the *district* and *state* of your complaint location.

Example: _Andheri, Maharashtra_ or _Whitefield, Karnataka_`;

/**
 * POST /api/whatsapp/webhook
 * Twilio calls this on every incoming WhatsApp message
 */
router.post('/webhook', async (req, res) => {
  const {
    From,
    Body,
    MediaUrl0,
    MediaContentType0,
    NumMedia,
  } = req.body;

  const phone = From ? From.replace('whatsapp:', '') : null;
  if (!phone) return res.status(400).send('<Response></Response>');

  const msg = (Body || '').trim();

  // Initialize session if not exists
  if (!userSessions[phone]) {
    userSessions[phone] = { step: 'GREET' };
  }
  const session = userSessions[phone];

  try {
    // ── STATUS CHECK (anytime) ─────────────────────────────────────────
    if (msg.toUpperCase().startsWith('STATUS ')) {
      const tid = msg.split(' ')[1].toUpperCase();
      const complaint = await Complaint.findOne({ tracking_id: tid });
      if (complaint) {
        const statusEmoji = {
          Registered: '🔵',
          'Under Review': '🟡',
          'In Progress': '🔧',
          Resolved: '✅',
        };
        const emoji = statusEmoji[complaint.status] || '📋';
        const trackUrl = `${process.env.BASE_URL}/track/${complaint.tracking_id}`;
        const reply = `${emoji} *Complaint ${tid}*\n\nStatus: *${complaint.status}*\nDepartment: ${complaint.department}\nSeverity: ${complaint.severity}\n\n${complaint.summary_en}\n\nFiled: ${complaint.filed_at.toDateString()}\n\nFull details: ${trackUrl}`;
        await sendWhatsApp(phone, reply);
      } else {
        await sendWhatsApp(phone, `❌ Complaint *${tid}* not found. Please check your tracking ID.`);
      }
      return res.status(200).send('<Response></Response>');
    }

    // ── START / GREET ──────────────────────────────────────────────────
    if (
      session.step === 'GREET' ||
      msg.toLowerCase() === 'hi' ||
      msg.toLowerCase() === 'hello' ||
      msg.toLowerCase() === 'start'
    ) {
      userSessions[phone] = { step: 'AWAIT_LANG' };
      await sendWhatsApp(phone, GREET_MESSAGE);
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT LANGUAGE ─────────────────────────────────────────────────
    if (session.step === 'AWAIT_LANG') {
      const langChoice = LANGUAGE_MAP[msg];
      if (!langChoice) {
        await sendWhatsApp(phone, '⚠️ Please reply with a number between 1 and 8 to choose your language.');
        return res.status(200).send('<Response></Response>');
      }
      session.language = langChoice.code;
      session.languageName = langChoice.name;
      session.step = 'AWAIT_COMPLAINT';
      await sendWhatsApp(phone, COMPLAINT_PROMPT(langChoice.name));
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT COMPLAINT TEXT OR VOICE ──────────────────────────────────
    if (session.step === 'AWAIT_COMPLAINT') {
      let complaintText = '';

      if (parseInt(NumMedia) > 0 && MediaContentType0 && MediaContentType0.startsWith('audio/')) {
        // Voice note received
        await sendWhatsApp(phone, '⏳ Processing your voice note... please wait a moment.');
        complaintText = await transcribeVoice(MediaUrl0);
      } else {
        complaintText = msg;
      }

      if (!complaintText.trim()) {
        await sendWhatsApp(phone, '⚠️ I couldn\'t understand your complaint. Please try again.');
        return res.status(200).send('<Response></Response>');
      }

      session.complaintText = complaintText;
      session.step = 'AWAIT_LOCATION';
      await sendWhatsApp(phone, LOCATION_PROMPT);
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT LOCATION ─────────────────────────────────────────────────
    if (session.step === 'AWAIT_LOCATION') {
      const location = msg;
      // Parse "district, state" from text
      const parts = location.split(',').map((s) => s.trim());
      const district = parts[0] || '';
      const state = parts[1] || '';

      await sendWhatsApp(phone, '🤖 Analyzing your complaint...');

      // AI Classification
      const fullText = `${session.complaintText} Location: ${location}`;
      const ai = await classifyComplaint(fullText, session.language);

      // Find or create user
      let user = await User.findOne({ phone });
      if (!user) {
        user = new User({ phone, preferred_language: session.language, whatsapp_linked: true });
        await user.save();
      } else if (!user.whatsapp_linked) {
        user.whatsapp_linked = true;
        await user.save();
      }

      // Save complaint
      const complaint = new Complaint({
        tracking_id: generateTrackingId(),
        user_id: user._id,
        phone,
        channel: 'whatsapp',
        raw_text: session.complaintText,
        input_language: session.language,
        summary_en: ai.summary_en,
        department: ai.department,
        severity: ai.severity,
        eta_days: ai.eta_days,
        state: state || ai.state || '',
        district: district || ai.district || '',
        lat: ai.lat,
        lng: ai.lng,
        status: 'Registered',
        status_history: [{ status: 'Registered', timestamp: new Date() }],
        filed_at: new Date(),
      });
      await complaint.save();

      const trackUrl = `${process.env.BASE_URL}/track/${complaint.tracking_id}`;
      const severityEmoji = { Low: '🟢', Medium: '🟡', High: '🟠', Critical: '🔴' };
      const sev = severityEmoji[complaint.severity] || '🟡';

      const successMsg = `✅ *Complaint Registered!*

🆔 Tracking ID: *${complaint.tracking_id}*
🏛️ Department: *${complaint.department}*
${sev} Severity: *${complaint.severity}*
📅 Expected Resolution: *${complaint.eta_days} days*

📋 Summary: _${complaint.summary_en}_

🔗 Track your complaint:
${trackUrl}

_Reply *STATUS ${complaint.tracking_id}* anytime for live updates._
_Reply *Hi* to file another complaint._`;

      await sendWhatsApp(phone, successMsg);

      // Clear session
      delete userSessions[phone];
      return res.status(200).send('<Response></Response>');
    }

    // ── FALLBACK ───────────────────────────────────────────────────────
    await sendWhatsApp(
      phone,
      `👋 Hi! I\'m CivicAI.\n\n• Reply *Hi* to file a new complaint\n• Reply *STATUS <tracking-id>* to check your complaint\n\nExample: STATUS CIV-ABC-123`
    );

  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
    await sendWhatsApp(
      phone,
      '⚠️ Something went wrong. Please try again or visit our website to file your complaint.'
    ).catch(() => {});
  }

  res.status(200).send('<Response></Response>');
});

/**
 * GET /api/whatsapp/send-test
 * Dev-only: send a test message
 */
router.get('/send-test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  try {
    const { to } = req.query;
    await sendWhatsApp(to, '🧪 CivicAI test message — backend is working!');
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
