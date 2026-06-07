'use strict';
const { makeModel } = require('../lib/memstore');

const Chat = makeModel('Chat', {
  title: 'New Conversation',
  messages: [],
  userId: null,
  subject: 'general',
  language: 'arabic',
  isArchived: false,
  documentContext: null
});

module.exports = Chat;
