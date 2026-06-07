'use strict';
const mongoose = require('mongoose');
const quizSubmissionSchema = new mongoose.Schema({
  quizId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',      required: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  answers:     { type: mongoose.Schema.Types.Mixed, default: [] },
  score:       { type: Number, default: 0 },
  maxScore:    { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  isGraded:    { type: Boolean, default: false },
  feedback:    { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.models.QuizSubmission || mongoose.model('QuizSubmission', quizSubmissionSchema);
