// models/group.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
   // unique: true
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}'
  }
}, {
  timestamps: true,
  tableName: 'Groups' // ← هذا السطر ضروري جدًا
});

module.exports = Group;
