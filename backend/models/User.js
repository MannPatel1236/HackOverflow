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
    otp: {
      code: String,
      expires_at: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
