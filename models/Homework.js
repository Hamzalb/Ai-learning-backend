'use strict';
const { makeModel } = require('../lib/memstore');

// submissions: [{ studentId, fileUrl, text, submittedAt, grade, feedback, status }]
const Homework = makeModel('Homework', {
  title: '',
  description: '',
  classroomId: null,
  subjectId: null,
  teacherId: null,
  schoolId: null,
  dueDate: null,
  submissions: []
});

module.exports = Homework;
