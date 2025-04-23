// models/guest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guest = sequelize.define('Guest', {
  guest_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastssen: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pic: {
    type: DataTypes.STRING,
    defaultValue: "pic.png"
  },
  topic: {
    type: DataTypes.STRING,
    defaultValue: ""
  },
  msg: {
    type: DataTypes.STRING,
    defaultValue: "(زائر)"
  },
  ucol: {
    type: DataTypes.STRING,
    defaultValue: "#000000"
  },
  mcol: {
    type: DataTypes.STRING,
    defaultValue: "#000000"
  },
  bg: {
    type: DataTypes.STRING,
    defaultValue: "#FFFFFF"
  }
}, {
  timestamps: true
});


module.exports = Guest;
