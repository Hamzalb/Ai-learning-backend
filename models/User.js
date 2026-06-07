'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['super_admin','school','principal','teacher','student'], default: 'student' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  isActive: { type: Boolean, default: true },
  avatar:   { type: String, default: null },
  phone:    { type: String, default: '' },
  // Legacy AI-learning fields
  streak:   { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  xp:       { type: Number, default: 0 },
  level:    { type: Number, default: 1 },
  badges:   { type: [String], default: [] },
  preferences: {
    language:   { type: String, default: 'arabic' },
    theme:      { type: String, default: 'dark' },
    difficulty: { type: String, default: 'beginner' }
  },
  stats: {
    totalQuizzes:   { type: Number, default: 0 },
    totalChats:     { type: Number, default: 0 },
    totalDocuments: { type: Number, default: 0 },
    averageScore:   { type: Number, default: 0 }
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
