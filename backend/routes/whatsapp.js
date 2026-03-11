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

// ── Supported languages ────────────────────────────────────────────────────
const LANGUAGE_MAP = {
  '1': { code: 'en', name: 'English' },
  '2': { code: 'hi', name: 'Hindi' },
  '3': { code: 'mr', name: 'Marathi' },
};

// ── All bot messages per language ──────────────────────────────────────────
const MESSAGES = {
  en: {
    greet:
      '🏙️ *Welcome to CivicAI!*\n\n' +
      "Your municipal grievance assistant. I'll help you file a complaint in your language.\n\n" +
      'Please choose your preferred language:\n' +
      '1️⃣ English\n' +
      '2️⃣ Hindi (हिंदी)\n' +
      '3️⃣ Marathi (मराठी)\n\n' +
      '_Reply with a number (1-3)_',

    invalidLang: '⚠️ Please reply with 1, 2, or 3 to choose your language.',

    complaintPrompt: (langName) =>
      `✅ Got it! Language set to *${langName}*.\n\n` +
      'Please describe your complaint now. You can:\n' +
      '📝 *Type* your complaint, OR\n' +
      '🎤 *Send a voice note*\n\n' +
      'Tell me what the issue is, where it is, and any other details.',

    locationPrompt:
      '📍 *Almost done!*\n\n' +
      'Please tell me the *district* and *state* of your complaint location.\n\n' +
      'Example: _Andheri, Maharashtra_ or _Whitefield, Karnataka_',

    processing: '⏳ Processing your voice note... please wait a moment.',
    analyzing: '🤖 Analyzing your complaint...',
    unclear: "⚠️ I couldn't understand your complaint. Please try again.",

    success: (c, trackUrl, sev) =>
      '✅ *Complaint Registered!*\n\n' +
      `🆔 Tracking ID: *${c.tracking_id}*\n` +
      `🏛️ Department: *${c.department}*\n` +
      `${sev} Severity: *${c.severity}*\n` +
      `📅 Expected Resolution: *${c.eta_days} days*\n\n` +
      `📋 Summary: _${c.summary_en}_\n\n` +
      `🔗 Track your complaint:\n${trackUrl}\n\n` +
      `_Reply *STATUS ${c.tracking_id}* anytime for updates._\n` +
      '_Reply *Hi* to file another complaint._',

    statusFound: (c, trackUrl, emoji) =>
      `${emoji} *Complaint ${c.tracking_id}*\n\n` +
      `Status: *${c.status}*\nDepartment: ${c.department}\nSeverity: ${c.severity}\n\n` +
      `${c.summary_en}\n\nFiled: ${c.filed_at.toDateString()}\n\nFull details: ${trackUrl}`,

    statusNotFound: (tid) =>
      `❌ Complaint *${tid}* not found. Please check your tracking ID.`,

    fallback:
      "👋 Hi! I'm CivicAI.\n\n" +
      '• Reply *Hi* to file a new complaint\n' +
      '• Reply *STATUS <tracking-id>* to check your complaint\n\n' +
      'Example: STATUS CIV-ABC-123',

    error: '⚠️ Something went wrong. Please try again or visit our website to file your complaint.',
  },

  hi: {
    greet:
      '🏙️ *CivicAI में आपका स्वागत है!*\n\n' +
      'मैं आपका नगरपालिका शिकायत सहायक हूँ। मैं आपकी भाषा में शिकायत दर्ज करने में मदद करूँगा।\n\n' +
      'कृपया अपनी भाषा चुनें:\n' +
      '1️⃣ English\n' +
      '2️⃣ हिंदी\n' +
      '3️⃣ मराठी\n\n' +
      '_संख्या (1-3) में उत्तर दें_',

    invalidLang: '⚠️ कृपया अपनी भाषा चुनने के लिए 1, 2 या 3 में उत्तर दें।',

    complaintPrompt: (langName) =>
      `✅ ठीक है! भाषा *${langName}* चुनी गई।\n\n` +
      'कृपया अब अपनी शिकायत बताएं। आप:\n' +
      '📝 *लिखकर* शिकायत दर्ज कर सकते हैं, या\n' +
      '🎤 *वॉइस नोट* भेज सकते हैं।\n\n' +
      'समस्या क्या है, कहाँ है और अन्य जानकारी बताएं।',

    locationPrompt:
      '📍 *लगभग हो गया!*\n\n' +
      'कृपया अपनी शिकायत स्थान का *जिला* और *राज्य* बताएं।\n\n' +
      'उदाहरण: _अंधेरी, महाराष्ट्र_ या _व्हाइटफील्ड, कर्नाटक_',

    processing: '⏳ आपका वॉइस नोट प्रोसेस हो रहा है... कृपया प्रतीक्षा करें।',
    analyzing: '🤖 आपकी शिकायत का विश्लेषण हो रहा है...',
    unclear: '⚠️ मैं आपकी शिकायत समझ नहीं पाया। कृपया फिर से प्रयास करें।',

    success: (c, trackUrl, sev) =>
      '✅ *शिकायत दर्ज हो गई!*\n\n' +
      `🆔 ट्रैकिंग ID: *${c.tracking_id}*\n` +
      `🏛️ विभाग: *${c.department}*\n` +
      `${sev} गंभीरता: *${c.severity}*\n` +
      `📅 अनुमानित समाधान: *${c.eta_days} दिन*\n\n` +
      `📋 सारांश: _${c.summary_en}_\n\n` +
      `🔗 अपनी शिकायत ट्रैक करें:\n${trackUrl}\n\n` +
      `_अपडेट के लिए *STATUS ${c.tracking_id}* लिखें।_\n` +
      '_नई शिकायत दर्ज करने के लिए *Hi* लिखें।_',

    statusFound: (c, trackUrl, emoji) =>
      `${emoji} *शिकायत ${c.tracking_id}*\n\n` +
      `स्थिति: *${c.status}*\nविभाग: ${c.department}\nगंभीरता: ${c.severity}\n\n` +
      `${c.summary_en}\n\nदर्ज की तारीख: ${c.filed_at.toDateString()}\n\nपूरी जानकारी: ${trackUrl}`,

    statusNotFound: (tid) =>
      `❌ शिकायत *${tid}* नहीं मिली। कृपया अपना ट्रैकिंग ID जांचें।`,

    fallback:
      '👋 नमस्ते! मैं CivicAI हूँ।\n\n' +
      '• नई शिकायत दर्ज करने के लिए *Hi* लिखें।\n' +
      '• शिकायत की स्थिति जानने के लिए *STATUS <tracking-id>* लिखें।\n\n' +
      'उदाहरण: STATUS CIV-ABC-123',

    error: '⚠️ कुछ गलत हो गया। कृपया फिर से प्रयास करें या हमारी वेबसाइट पर जाएं।',
  },

  mr: {
    greet:
      '🏙️ *CivicAI मध्ये आपले स्वागत आहे!*\n\n' +
      'मी आपला नगरपालिका तक्रार सहाय्यक आहे. मी आपल्या भाषेत तक्रार नोंदवण्यास मदत करेन.\n\n' +
      'कृपया आपली भाषा निवडा:\n' +
      '1️⃣ English\n' +
      '2️⃣ हिंदी\n' +
      '3️⃣ मराठी\n\n' +
      '_क्रमांक (1-3) मध्ये उत्तर द्या_',

    invalidLang: '⚠️ कृपया आपली भाषा निवडण्यासाठी 1, 2 किंवा 3 मध्ये उत्तर द्या.',

    complaintPrompt: (langName) =>
      `✅ ठीक आहे! भाषा *${langName}* निवडली आहे.\n\n` +
      'कृपया आता आपली तक्रार सांगा. आपण:\n' +
      '📝 *लिहून* तक्रार नोंदवू शकता, किंवा\n' +
      '🎤 *व्हॉइस नोट* पाठवू शकता.\n\n' +
      'समस्या काय आहे, कुठे आहे आणि इतर माहिती सांगा.',

    locationPrompt:
      '📍 *जवळजवळ झाले!*\n\n' +
      'कृपया आपल्या तक्रारीचा *जिल्हा* आणि *राज्य* सांगा.\n\n' +
      'उदाहरण: _अंधेरी, महाराष्ट्र_ किंवा _व्हाइटफील्ड, कर्नाटक_',

    processing: '⏳ आपला व्हॉइस नोट प्रक्रिया होत आहे... कृपया थांबा.',
    analyzing: '🤖 आपल्या तक्रारीचे विश्लेषण होत आहे...',
    unclear: '⚠️ मला आपली तक्रार समजली नाही. कृपया पुन्हा प्रयत्न करा.',

    success: (c, trackUrl, sev) =>
      '✅ *तक्रार नोंदवली गेली!*\n\n' +
      `🆔 ट्रॅकिंग ID: *${c.tracking_id}*\n` +
      `🏛️ विभाग: *${c.department}*\n` +
      `${sev} तीव्रता: *${c.severity}*\n` +
      `📅 अपेक्षित निराकरण: *${c.eta_days} दिवस*\n\n` +
      `📋 सारांश: _${c.summary_en}_\n\n` +
      `🔗 आपली तक्रार ट्रॅक करा:\n${trackUrl}\n\n` +
      `_अपडेटसाठी *STATUS ${c.tracking_id}* लिहा._\n` +
      '_नवीन तक्रार नोंदवण्यासाठी *Hi* लिहा._',

    statusFound: (c, trackUrl, emoji) =>
      `${emoji} *तक्रार ${c.tracking_id}*\n\n` +
      `स्थिती: *${c.status}*\nविभाग: ${c.department}\nतीव्रता: ${c.severity}\n\n` +
      `${c.summary_en}\n\nनोंदणी तारीख: ${c.filed_at.toDateString()}\n\nपूर्ण माहिती: ${trackUrl}`,

    statusNotFound: (tid) =>
      `❌ तक्रार *${tid}* सापडली नाही. कृपया आपला ट्रॅकिंग ID तपासा.`,

    fallback:
      '👋 नमस्कार! मी CivicAI आहे.\n\n' +
      '• नवीन तक्रार नोंदवण्यासाठी *Hi* लिहा.\n' +
      '• तक्रारीची स्थिती जाणण्यासाठी *STATUS <tracking-id>* लिहा.\n\n' +
      'उदाहरण: STATUS CIV-ABC-123',

    error: '⚠️ काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा किंवा आमच्या वेबसाइटला भेट द्या.',
  },
};

// Helper: get messages for a session's language, fallback to English
function M(session) {
  return MESSAGES[session && session.language] || MESSAGES.en;
}

/**
 * POST /api/whatsapp/webhook
 * Twilio calls this on every incoming WhatsApp message
 */
router.post('/webhook', async (req, res) => {
  const { From, Body, MediaUrl0, MediaContentType0, NumMedia } = req.body;

  const phone = From ? From.replace('whatsapp:', '') : null;
  if (!phone) return res.status(400).send('<Response></Response>');

  const msg = (Body || '').trim();

  // Initialize session
  if (!userSessions[phone]) {
    // New session: immediately send language menu
    userSessions[phone] = { step: 'AWAIT_LANG', language: 'en' };
    await sendWhatsApp(phone, MESSAGES.en.greet);
    return res.status(200).send('<Response></Response>');
  }
  const session = userSessions[phone];

  try {
    // ── STATUS CHECK (anytime) ─────────────────────────────────────────
    if (msg.toUpperCase().startsWith('STATUS ')) {
      const tid = msg.split(' ')[1].toUpperCase();
      const complaint = await Complaint.findOne({ tracking_id: tid });
      const m = M(session);
      if (complaint) {
        const statusEmoji = {
          Registered: '🔵',
          'Under Review': '🟡',
          'In Progress': '🔧',
          Resolved: '✅',
        };
        const emoji = statusEmoji[complaint.status] || '📋';
        const trackUrl = `${process.env.BASE_URL}/track/${complaint.tracking_id}`;
        await sendWhatsApp(phone, m.statusFound(complaint, trackUrl, emoji));
      } else {
        await sendWhatsApp(phone, m.statusNotFound(tid));
      }
      return res.status(200).send('<Response></Response>');
    }

    // ── RESTART: hi/hello/start resets the flow ────────────────────────
    // Only outside of AWAIT_LANG so language choice '1/2/3' isn't confused with hi
    if (
      session.step !== 'AWAIT_LANG' &&
      (msg.toLowerCase() === 'hi' ||
        msg.toLowerCase() === 'hello' ||
        msg.toLowerCase() === 'start')
    ) {
      userSessions[phone] = { step: 'AWAIT_LANG', language: 'en' };
      await sendWhatsApp(phone, MESSAGES.en.greet);
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT LANGUAGE ─────────────────────────────────────────────────
    if (session.step === 'AWAIT_LANG') {
      const langChoice = LANGUAGE_MAP[msg];
      if (!langChoice) {
        await sendWhatsApp(phone, MESSAGES.en.invalidLang);
        return res.status(200).send('<Response></Response>');
      }
      session.language = langChoice.code;
      session.languageName = langChoice.name;
      session.step = 'AWAIT_COMPLAINT';
      const m = M(session);
      await sendWhatsApp(phone, m.complaintPrompt(langChoice.name));
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT COMPLAINT TEXT OR VOICE ──────────────────────────────────
    if (session.step === 'AWAIT_COMPLAINT') {
      const m = M(session);
      let complaintText = '';

      if (parseInt(NumMedia) > 0 && MediaContentType0 && MediaContentType0.startsWith('audio/')) {
        await sendWhatsApp(phone, m.processing);
        complaintText = await transcribeVoice(MediaUrl0);
      } else {
        complaintText = msg;
      }

      if (!complaintText.trim()) {
        await sendWhatsApp(phone, m.unclear);
        return res.status(200).send('<Response></Response>');
      }

      session.complaintText = complaintText;
      session.step = 'AWAIT_LOCATION';
      await sendWhatsApp(phone, m.locationPrompt);
      return res.status(200).send('<Response></Response>');
    }

    // ── AWAIT LOCATION ─────────────────────────────────────────────────
    if (session.step === 'AWAIT_LOCATION') {
      const m = M(session);
      const location = msg;
      const parts = location.split(',').map((s) => s.trim());
      const district = parts[0] || '';
      const state = parts[1] || '';

      await sendWhatsApp(phone, m.analyzing);

      const fullText = `${session.complaintText} Location: ${location}`;
      const ai = await classifyComplaint(fullText, session.language);

      let user = await User.findOne({ phone });
      if (!user) {
        user = new User({ phone, preferred_language: session.language, whatsapp_linked: true });
        await user.save();
      } else if (!user.whatsapp_linked) {
        user.whatsapp_linked = true;
        await user.save();
      }

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

      await sendWhatsApp(phone, m.success(complaint, trackUrl, sev));

      delete userSessions[phone];
      return res.status(200).send('<Response></Response>');
    }

    // ── FALLBACK ───────────────────────────────────────────────────────
    await sendWhatsApp(phone, M(session).fallback);

  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
    await sendWhatsApp(phone, M(session).error).catch(() => { });
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
