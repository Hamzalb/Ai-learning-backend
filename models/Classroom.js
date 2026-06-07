'use strict';
const mongoose = require('mongoose');
const classroomSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  gradeLevel: { type: String, default: '' },
  capacity:   { type: Number, default: 30 },
  schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   default: null },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
}, { timestamps: true });
module.exports = mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema);
