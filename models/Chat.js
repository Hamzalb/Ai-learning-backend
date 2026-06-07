'use strict';
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user','assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });
const chatSchema = new mongoose.Schema({
  title:           { type: String, default: 'New Conversation' },
  messages:        { type: [messageSchema], default: [] },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:         { type: String, default: 'general' },
  language:        { type: String, default: 'arabic' },
  isArchived:      { type: Boolean, default: false },
  documentContext: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null }
}, { timestamps: true });
module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
