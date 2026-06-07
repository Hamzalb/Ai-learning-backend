'use strict';
const { makeModel } = require('../lib/memstore');

const Subject = makeModel('Subject', {
  name: '',
  classroomId: null,
  teacherId: null,
  schoolId: null,
  color: '#6366f1'
});

module.exports = Subject;
