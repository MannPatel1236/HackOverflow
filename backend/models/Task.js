const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['Contractor', 'Sponsor'], required: true },
    bid_amount: { type: Number, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    applied_at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget_estimate: { type: Number, required: true },
    
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'Completed'],
      default: 'Open',
    },
    
    applications: [applicationSchema],
    
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assigned_role: { type: String, enum: ['Contractor', 'Sponsor'], default: null },
    assigned_amount: { type: Number, default: null },
    
    created_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
