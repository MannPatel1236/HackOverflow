const twilio = require('twilio');
const axios = require('axios');
const FormData = require('form-data');

// Lazy Twilio client — only initialized on first call.
// This prevents a crash on startup if TWILIO_ACCOUNT_SID is not set.
let _client = null;
function getClient() {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !auth) {
    console.warn('⚠ TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set. WhatsApp messages will be skipped.');
    return null;
  }
  _client = twilio(sid, auth);
  return _client;
}

/**
 * Send a WhatsApp message via Twilio
 */
async function sendWhatsApp(to, body) {
  const client = getClient();
  if (!client) return null; // No Twilio credentials — skip gracefully

  try {
    // Ensure 'whatsapp:' prefix and clean the number
    let cleanNumber = to.replace(/[^\d+]/g, '');
    if (cleanNumber.length === 10 && !cleanNumber.startsWith('+')) {
      cleanNumber = `+91${cleanNumber}`;
    }

    const toFormatted = cleanNumber.startsWith('whatsapp:') ? cleanNumber : `whatsapp:${cleanNumber}`;

    console.log(`Attempting to send WhatsApp message to: ${toFormatted}`);

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: toFormatted,
      body,
    });

    console.log(`WhatsApp message sent! SID: ${message.sid}`);
    return message.sid;
  } catch (err) {
    console.error('CRITICAL: WhatsApp send failed!');
    console.error('Error Message:', err.message);
    console.error('Twilio Error Code:', err.code);

    if (err.code === 63003 || err.code === 63015) {
      console.error('HINT: This number likely hasn\'t joined your Twilio Sandbox. Ask them to send "join <your-sandbox-keyword>" to your Twilio number.');
    }

    // Fail gracefully so the app can continue working (e.g. returning dev_otp)
    return null;
  }
}

/**
 * Transcribe a voice note URL using OpenAI Whisper API
 * Twilio requires auth to download media
 */
async function transcribeVoice(mediaUrl) {
  try {
    const { data: audioBuffer } = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
    });

    const { createClient } = require('@deepgram/sdk');
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY || 'MISSING_KEY');

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      Buffer.from(audioBuffer),
      {
        model: 'nova-2',
        smart_format: true,
        detect_language: true,
      }
    );

    if (error) throw error;

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || '';
    if (!transcript) throw new Error('Empty transcript returned empty text.');

    return transcript;
  } catch (err) {
    console.error('Deepgram transcription error:', err.message || err);
    throw new Error('Failed to transcribe voice note');
  }
}

/**
 * Call Groq API directly to classify complaint (replaces separate Python service)
 */
async function classifyComplaint(text, lang = 'en') {
  try {
    const prompt = `You are an expert municipal complaint classifier for Indian cities.
    Given the complaint text (which may be in ANY Indian language like Hindi, Marathi, etc. or English), analyze it and return ONLY a valid JSON object.
    Rules:
    - department: Choose EXACTLY one of: Roads, Sanitation, Water, Electricity, Other
    - severity: Choose EXACTLY one of: Low, Medium, High, Critical
    - summary_en: A single clear English sentence summarizing the complaint (max 20 words)
    - eta_days: Integer — Critical=1, High=3, Medium=5, Low=7
    - state: Indian state name if mentioned (e.g., Maharashtra)
    - district: District or area name if mentioned (e.g., Panvel)
    - lat/lng: Approximate coordinates if city/district mentioned
    Complaint: ${text}
    Return ONLY JSON:`;

    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = JSON.parse(data.choices[0].message.content);

    return {
      department: result.department || 'Other',
      severity: result.severity || 'Medium',
      summary_en: result.summary_en || text.slice(0, 100),
      eta_days: result.eta_days || 5,
      state: result.state || '',
      district: result.district || '',
      lat: result.lat || null,
      lng: result.lng || null
    };
  } catch (err) {
    console.error('Groq AI error:', err.response?.data || err.message);
    return {
      department: 'Other',
      severity: 'Medium',
      summary_en: text.slice(0, 100),
      eta_days: 5,
      state: '',
      district: '',
      lat: null,
      lng: null,
    };
  }
}

/**
 * Generate human-readable tracking ID
 */
function generateTrackingId() {
  const prefix = 'CIV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format status update WhatsApp message
 */
function statusUpdateMessage(complaint) {
  const trackUrl = `${process.env.CLIENT_URL || process.env.BASE_URL}/track/${complaint.tracking_id}`;
  const statusEmoji = {
    Registered: '🔵',
    'Under Review': '🟡',
    'In Progress': '🔧',
    Resolved: '✅',
  };
  const emoji = statusEmoji[complaint.status] || '📋';

  return `${emoji} *CivicAI Update*\n\nYour complaint *${complaint.tracking_id}* has been updated.\n\nNew Status: *${complaint.status}*\nSummary: ${complaint.summary_en}\n\nTrack here: ${trackUrl}\n\n_Reply STATUS ${complaint.tracking_id} anytime for updates._`;
}

module.exports = {
  sendWhatsApp,
  transcribeVoice,
  classifyComplaint,
  generateTrackingId,
  statusUpdateMessage,
};
