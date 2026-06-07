'use strict';
const mongoose = require('mongoose');
const submissionSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl:     { type: String, default: '' },
  text:        { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  grade:       { type: Number, default: null },
  feedback:    { type: String, default: '' },
  status:      { type: String, enum: ['submitted','graded'], default: 'submitted' }
}, { _id: false });
const homeworkSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',   default: null },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  dueDate:     { type: Date, default: null },
  submissions: { type: [submissionSchema], default: [] }
}, { timestamps: true });
module.exports = mongoose.models.Homework || mongoose.model('Homework', homeworkSchema);
