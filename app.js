require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const connectDB = require('./config/database');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Legacy routes
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const pdfRoutes = require('./routes/pdf');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');

// School Management System routes
const superAdminRoutes = require('./routes/superAdmin');
const schoolRoutes = require('./routes/school');
const principalRoutes = require('./routes/principal');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', globalRateLimiter);

// Auth
app.use('/api/auth', authRoutes);

// Legacy AI-learning routes
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

// School Management System
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'School Management System API is running', timestamp: new Date().toISOString() });
});

// Seed super admin on startup
const seedSuperAdmin = async () => {
  const User = require('./models/User');
  const existing = await User.findOne({ role: 'super_admin' });
  if (!existing) {
    await User.create({
      name: 'Super Admin',
      email: 'hamzaloubani1234@gmail.com',
      password: 'Lo2005ha',
      role: 'super_admin',
      isActive: true
    });
    console.log('✅ Super admin seeded: hamzaloubani1234@gmail.com / Lo2005ha');
  }
};

setTimeout(seedSuperAdmin, 500);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
