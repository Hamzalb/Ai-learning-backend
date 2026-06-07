'use strict';
const { makeModel } = require('../lib/memstore');

const AuditLog = makeModel('AuditLog', {
  actorId: null,
  actorName: '',
  actorRole: '',
  action: '',
  targetId: null,
  targetModel: '',
  details: {},
  schoolId: null
});

module.exports = AuditLog;
