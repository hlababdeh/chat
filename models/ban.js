// models/ban.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ban = sequelize.define('Ban', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_band: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  deccode: {
    type: DataTypes.STRING,
  },
  decoderDans: {
    type: DataTypes.STRING,
  },
  device_band: {
    type: DataTypes.STRING,
  },
  ip_band: {
    type: DataTypes.STRING,
  },
  country_band: {
    type: DataTypes.STRING(2),
  },
  date: {
    type: DataTypes.STRING,
    defaultValue: 'دائم',
  },
}, {
  timestamps: true
});

module.exports = Ban;
