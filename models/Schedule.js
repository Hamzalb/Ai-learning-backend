'use strict';
const { makeModel } = require('../lib/memstore');

// slots: [{ day, period, startTime, endTime, subjectId, teacherId }]
const Schedule = makeModel('Schedule', {
  classroomId: null,
  schoolId: null,
  slots: []
});

module.exports = Schedule;
