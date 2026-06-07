'use strict';
const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',   default: null },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  date:        { type: Date, required: true },
  status:      { type: String, enum: ['present','absent','late'], default: 'present' },
  note:        { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
