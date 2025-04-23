// models/Log.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  device: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en'
  },
  isin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  time: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'logs',
  timestamps: false
});

module.exports = Log;
