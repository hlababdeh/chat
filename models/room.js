// models/room.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  idroom: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  about: { type: DataTypes.STRING },
  user: { type: DataTypes.STRING },
  pass: { type: DataTypes.STRING },
  id: { type: DataTypes.STRING },
  owner: { type: DataTypes.STRING },
  topic: { type: DataTypes.STRING },
  pic: { type: DataTypes.STRING },
  collor: { type: DataTypes.STRING, defaultValue: "#000" },
  rmli: { type: DataTypes.INTEGER, defaultValue: 0 },
  welcome: { type: DataTypes.STRING },
  broadcast: { type: DataTypes.BOOLEAN, defaultValue: false },
  deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  needpass: { type: DataTypes.BOOLEAN, defaultValue: false },
  max: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true
});

module.exports = Room;
