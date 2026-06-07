'use strict';
const { makeModel } = require('../lib/memstore');

// status: pending | paid | overdue
const Payment = makeModel('Payment', {
  studentId: null,
  schoolId: null,
  amount: 0,
  currency: 'USD',
  status: 'pending',
  dueDate: null,
  paidAt: null,
  description: 'Tuition Fee',
  receiptUrl: null
});

module.exports = Payment;
