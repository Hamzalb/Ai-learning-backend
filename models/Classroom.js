'use strict';
const { makeModel } = require('../lib/memstore');

const Classroom = makeModel('Classroom', {
  name: '',
  gradeLevel: '',
  capacity: 30,
  schoolId: null,
  teacherId: null,
  studentIds: [],
  subjectIds: []
});

module.exports = Classroom;
