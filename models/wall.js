// models/Wall.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wall = sequelize.define('Wall', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  msg: { type: DataTypes.STRING },
  likes: { type: DataTypes.TEXT },   // JSON string e.g. '["uid1", "uid2"]'
  bcc: { type: DataTypes.TEXT },     // JSON string for comments
  pic: { type: DataTypes.STRING },   // رابط صورة أو فيديو (اختياري)
  uid: { type: DataTypes.STRING },   // معرف العضو (User ID)
  username: { type: DataTypes.STRING }, // 🆕 اسم العضو (عضو أو زائر)
}, {
  timestamps: true
});

module.exports = Wall;
