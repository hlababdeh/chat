const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  idreg: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bg: { type: DataTypes.STRING, defaultValue: "#FFFFFF" },
  mcol: { type: DataTypes.STRING, defaultValue: "#000000" },
  ucol: { type: DataTypes.STRING, defaultValue: "#000000" },
  evaluation: { type: DataTypes.INTEGER, defaultValue: 0 },
  ico: { type: DataTypes.STRING, defaultValue: "" },
  ip: { type: DataTypes.STRING, defaultValue: "" },
  fp: { type: DataTypes.STRING, defaultValue: "" },
  id: { type: DataTypes.STRING },
  lid: { type: DataTypes.STRING },
  uid: { type: DataTypes.STRING },
  msg: { type: DataTypes.STRING, defaultValue: "(عضو جديد)" },
  pic: { type: DataTypes.STRING, defaultValue: "pic.png" },
  im1: { type: DataTypes.STRING, defaultValue: "im1.png" },
  im2: { type: DataTypes.STRING, defaultValue: "im2.png" },
  im3: { type: DataTypes.STRING, defaultValue: "im3.png" },
  power: { type: DataTypes.STRING, defaultValue: "" },
  rep: { type: DataTypes.BIGINT, defaultValue: 0 },
  topic: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  token: { type: DataTypes.STRING, allowNull: false },
  loginG: { type: DataTypes.BOOLEAN, defaultValue: false },
  muted: { type: DataTypes.BOOLEAN, defaultValue: false },
  documentationc: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastssen: { type: DataTypes.TEXT },
  joinuser: { type: DataTypes.TEXT },

  // 🔥 الحقل الجديد لربط المستخدم بمجموعة صلاحيات
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Groups',
      key: 'id'
    }
  }

}, {
  timestamps: true
});

module.exports = User;
