'use strict';
const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  filename:        { type: String, default: '' },
  originalName:    { type: String, default: '' },
  fileUrl:         { type: String, default: '' },
  fileSize:        { type: Number, default: 0 },
  size:            { type: Number, default: 0 },
  mimeType:        { type: String, default: '' },
  extractedText:   { type: String, default: '' },
  pageCount:       { type: Number, default: 1 },
  language:        { type: String, default: 'mixed' },
  subject:         { type: String, default: 'General' },
  processingStatus:{ type: String, default: 'pending' },
  summary:         { type: String, default: null },
  keywords:        { type: [String], default: [] },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  classroomId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  teacherId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  schoolId:        { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  visibility:      { type: mongoose.Schema.Types.Mixed, default: 'all' },
  category:        { type: String, enum: ['lecture','assignment','resource','exam'], default: 'lecture' },
  isProtected:     { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);
