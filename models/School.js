'use strict';
const mongoose = require('mongoose');
const schoolSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  address:      { type: String, default: '' },
  logo:         { type: String, default: null },
  contactEmail: { type: String, default: '', lowercase: true, trim: true },
  phone:        { type: String, default: '' },
  principalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive:     { type: Boolean, default: true },
  academicYear: { type: String, default: '' },
  featureFlags: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
module.exports = mongoose.models.School || mongoose.model('School', schoolSchema);
