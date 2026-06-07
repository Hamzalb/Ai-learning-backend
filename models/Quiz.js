'use strict';
const { makeModel } = require('../lib/memstore');

const Quiz = makeModel('Quiz', {
  title: '',
  subject: 'General',
  difficulty: 'medium',
  questions: [],
  totalPoints: 0,
  timeLimit: 30,
  sourceDocumentId: null,
  attempts: [],
  userId: null,
  isPublic: false,
  language: 'mixed'
}, {
  preSave: (raw) => {
    if (raw.questions && raw.questions.length > 0) {
      raw.totalPoints = raw.questions.reduce((s, q) => s + (q.points || 10), 0);
    }
  }
});

module.exports = Quiz;
