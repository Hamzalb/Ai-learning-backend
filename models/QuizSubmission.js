'use strict';
const { makeModel } = require('../lib/memstore');

const QuizSubmission = makeModel('QuizSubmission', {
  quizId: null,
  studentId: null,
  classroomId: null,
  answers: [],
  score: 0,
  maxScore: 0,
  submittedAt: null,
  isGraded: false,
  feedback: ''
});

module.exports = QuizSubmission;
