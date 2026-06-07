'use strict';
const { makeModel } = require('../lib/memstore');

const Document = makeModel('Document', {
  title: '',
  filename: '',
  originalName: '',
  fileUrl: '',
  fileSize: 0,
  size: 0,
  mimeType: '',
  extractedText: '',
  pageCount: 1,
  language: 'mixed',
  subject: 'General',
  processingStatus: 'pending',
  summary: null,
  keywords: [],
  userId: null,
  // School management fields
  classroomId: null,
  teacherId: null,
  schoolId: null,
  visibility: 'all', // 'all' | studentId[]
  category: 'lecture', // lecture | assignment | resource | exam
  isProtected: true
});

module.exports = Document;
