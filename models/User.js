'use strict';
const bcrypt = require('bcryptjs');
const { makeModel } = require('../lib/memstore');

const User = makeModel('User', {
  name: '',
  email: '',
  password: '',
  role: 'student',
  avatar: null,
  isVerified: false,
  streak: 0,
  lastActive: null,
  xp: 0,
  level: 1,
  badges: [],
  preferences: { language: 'arabic', theme: 'dark', difficulty: 'beginner' },
  stats: { totalQuizzes: 0, totalChats: 0, totalDocuments: 0, averageScore: 0 }
}, {
  preSave: async (raw) => {
    // Hash password if it looks plain-text
    if (raw.password && !raw.password.startsWith('$2')) {
      raw.password = await bcrypt.hash(raw.password, 12);
    }
    if (!raw.lastActive) raw.lastActive = new Date();
  },
  afterWrap: (doc) => {
    doc.comparePassword = (candidate) => bcrypt.compare(candidate, doc.password);
    const origToJSON = doc.toJSON.bind(doc);
    doc.toJSON = () => {
      const o = origToJSON();
      delete o.password;
      delete o.verificationToken;
      delete o.resetPasswordToken;
      delete o.resetPasswordExpires;
      return o;
    };
  }
});

module.exports = User;
