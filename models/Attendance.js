'use strict';
const { makeModel } = require('../lib/memstore');

// status: present | absent | late
const Attendance = makeModel('Attendance', {
  studentId: null,
  classroomId: null,
  subjectId: null,
  schoolId: null,
  date: null,
  status: 'present',
  note: ''
});

module.exports = Attendance;
