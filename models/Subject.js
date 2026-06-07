'use strict';
const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  color:       { type: String, default: '#6366f1' }
}, { timestamps: true });
module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
