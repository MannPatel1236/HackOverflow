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
      summary_en: text || 'Complaint filed without description.',
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
