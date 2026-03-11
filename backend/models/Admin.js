const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['state_admin', 'super_admin'],
      default: 'state_admin',
    },
    state: {
      type: String,
      default: null, // null for super_admin
    },
  },
  { timestamps: true }
);

// Hash password before save
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
  next();
});

adminSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('Admin', adminSchema);
