'use strict';
const { makeModel } = require('../lib/memstore');

const Flashcard = makeModel('Flashcard', {
  front: '',
  back: '',
  subject: 'general',
  tags: [],
  userId: null,
  confidence: 0,   // 0=new 1=hard 2=medium 3=easy 4=mastered
  nextReview: null,
  reviewCount: 0,
  sourceDocumentId: null
});

module.exports = Flashcard;
