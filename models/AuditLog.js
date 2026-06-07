'use strict';
const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  actorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorName:   { type: String, default: '' },
  actorRole:   { type: String, default: '' },
  action:      { type: String, required: true },
  targetId:    { type: mongoose.Schema.Types.ObjectId, default: null },
  targetModel: { type: String, default: '' },
  details:     { type: mongoose.Schema.Types.Mixed, default: {} },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null }
}, { timestamps: true });
module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
