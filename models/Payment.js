'use strict';
const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  schoolId:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  amount:      { type: Number, default: 0 },
  currency:    { type: String, default: 'USD' },
  status:      { type: String, enum: ['pending','paid','overdue'], default: 'pending' },
  dueDate:     { type: Date, default: null },
  paidAt:      { type: Date, default: null },
  description: { type: String, default: 'Tuition Fee' },
  receiptUrl:  { type: String, default: null }
}, { timestamps: true });
module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
