const connectDB = async () => {
  const uri = process.env.MONGO_URI || '';
  const isReal = uri && !uri.includes('placeholder') && !uri.includes('username:password');

  if (isReal) {
    const mongoose = require('mongoose');
    try {
      const conn = await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err.message);
    }
  }

  console.log('✅ Database: in-memory store (demo mode)');
  console.log('ℹ️  Add MONGO_URI in server/.env for a real MongoDB database');
};

module.exports = connectDB;
