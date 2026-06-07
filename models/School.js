'use strict';
const { makeModel } = require('../lib/memstore');

const School = makeModel('School', {
  name: '',
  address: '',
  logo: null,
  contactEmail: '',
  phone: '',
  principalId: null,
  createdBy: null,
  isActive: true,
  academicYear: { startDate: null, endDate: null, terms: [] },
  featureFlags: {}
});

module.exports = School;
