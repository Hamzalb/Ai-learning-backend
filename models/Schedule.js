'use strict';
const mongoose = require('mongoose');
const slotSchema = new mongoose.Schema({
  day:       String,
  period:    String,
  startTime: String,
  endTime:   String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null }
}, { _id: false });
const scheduleSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  slots:       { type: [slotSchema], default: [] }
}, { timestamps: true });
module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
