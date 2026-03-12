const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    preferred_language: {
      type: String,
      enum: ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa'],
      default: 'en',
    },
    whatsapp_linked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['Citizen', 'Partner', 'Admin', 'SuperAdmin'],
      default: 'Citizen',
    },
    partner_profile: {
      company_name: { type: String, default: '' },
      gst_number: { type: String, default: '' },
      contact_email: { type: String, default: '' },
      is_verified: { type: Boolean, default: false }
    },
    otp: {
      code: String,
      expires_at: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
