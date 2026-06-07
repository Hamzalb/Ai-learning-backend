'use strict';
const mongoose = require('mongoose');
const gradeSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',   required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  type:     { type: String, enum: ['quiz','midterm','final','homework','participation'], default: 'quiz' },
  score:    { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  term:     { type: String, default: 'term1' },
  note:     { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.models.Grade || mongoose.model('Grade', gradeSchema);
