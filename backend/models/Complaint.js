const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Registered', 'Under Review', 'In Progress', 'Resolved'],
    },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    tracking_id: {
      type: String,
      unique: true,
      required: true,
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, required: true },
    channel: { type: String, enum: ['web', 'whatsapp'], default: 'web' },

    // Raw input
    raw_text: { type: String, required: true },
    input_language: { type: String, default: 'en' },
    voice_url: { type: String, default: '' },

    // AI output
    summary_en: { type: String, default: '' },
    department: {
      type: String,
      enum: ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'],
      default: 'Other',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    eta_days: { type: Number, default: 7 },

    // Location
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // Status tracking
    status: {
      type: String,
      enum: ['Registered', 'Under Review', 'In Progress', 'Resolved'],
      default: 'Registered',
    },
    status_history: [statusHistorySchema],
    sla_breach: { type: Boolean, default: false },

    filed_at: { type: Date, default: Date.now },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-check SLA breach: if >72hrs and not resolved
complaintSchema.methods.checkSLA = function () {
  if (this.status === 'Resolved') return false;
  const hoursElapsed = (Date.now() - this.filed_at.getTime()) / 3600000;
  return hoursElapsed > 72;
};

// Index for fast geo queries
complaintSchema.index({ state: 1, district: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ filed_at: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
