'use strict';
const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  type:          { type: String, enum: ['multiple_choice','true_false','short_answer'], default: 'multiple_choice' },
  options:       { type: [String], default: [] },
  correctAnswer: { type: String, default: '' },
  explanation:   { type: String, default: '' },
  points:        { type: Number, default: 10 }
}, { _id: false });
const attemptSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answers:   { type: [String], default: [] },
  score:     { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
}, { _id: false });
const quizSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  subject:          { type: String, default: 'General' },
  difficulty:       { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  questions:        { type: [questionSchema], default: [] },
  totalPoints:      { type: Number, default: 0 },
  timeLimit:        { type: Number, default: 30 },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  attempts:         { type: [attemptSchema], default: [] },
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPublic:         { type: Boolean, default: false },
  language:         { type: String, default: 'mixed' },
  // SMS fields
  classroomId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  teacherId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',      default: null },
  schoolId:         { type: mongoose.Schema.Types.ObjectId, ref: 'School',    default: null },
  dueDate:          { type: Date, default: null },
  duration:         { type: Number, default: 30 }
}, {
  timestamps: true
});
quizSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((s, q) => s + (q.points || 10), 0);
  }
  next();
});
module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
