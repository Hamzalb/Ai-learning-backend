'use strict';
const { makeModel } = require('../lib/memstore');

// type: quiz | midterm | final | homework | participation
const Grade = makeModel('Grade', {
  studentId: null,
  subjectId: null,
  classroomId: null,
  schoolId: null,
  teacherId: null,
  type: 'quiz',
  score: 0,
  maxScore: 100,
  term: 'term1',
  note: ''
});

module.exports = Grade;
