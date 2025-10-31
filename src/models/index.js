const { sequelize, testConnection } = require('../config/database');
const User = require('./User');
const OTP = require('./OTP');
const AuditLog = require('./AuditLog');

// Import Sequelize operators for use in models
const { Op } = require('sequelize');

// Make Sequelize operators available in models
sequelize.Op = Op;

// Define associations if needed
// User.hasMany(OTP, { foreignKey: 'email', sourceKey: 'email' });
// OTP.belongsTo(User, { foreignKey: 'email', targetKey: 'email' });

// Sync database (only in development)
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // This will create tables if they don't exist
      // Set force: true to drop and recreate tables (careful with data!)
      await sequelize.sync({ force: false, alter: false });
      console.log('✅ Database synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  User,
  OTP,
  AuditLog,
  syncDatabase
};
