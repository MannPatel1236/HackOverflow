const twilio = require('twilio');
const axios = require('axios');
const FormData = require('form-data');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send a WhatsApp message via Twilio
 */
async function sendWhatsApp(to, body) {
  try {
    // Ensure 'whatsapp:' prefix
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: toFormatted,
      body,
    });
    return message.sid;
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    console.error('If you are using Twilio Sandbox, ensure you have opted in by sending a message to the Sandbox number first.');
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

    const form = new FormData();
    form.append('file', Buffer.from(audioBuffer), {
      filename: 'audio.ogg',
      contentType: 'audio/ogg',
    });
    form.append('model', 'whisper-1');
    // Don't specify language — let Whisper auto-detect for multilingual support

    const { data } = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return data.text;
  } catch (err) {
    console.error('Whisper transcription error:', err.message);
    throw new Error('Failed to transcribe voice note');
  }
}

/**
 * Call FastAPI AI service to classify complaint
 */
async function classifyComplaint(text, lang = 'en') {
  try {
    const { data } = await axios.post(`${process.env.FASTAPI_URL}/classify`, {
      text,
      lang,
    });
    return data;
  } catch (err) {
    console.error('AI classification error:', err.message);
    // Fallback classification if AI service is down
    return {
      department: 'Other',
      severity: 'Medium',
      summary_en: text.substring(0, 100),
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
  const trackUrl = `${process.env.BASE_URL}/track/${complaint.tracking_id}`;
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
