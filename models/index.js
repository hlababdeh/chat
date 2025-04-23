const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

const db = {}; // ← تعريف db في الأعلى

// استدعاء النماذج
db.User = require('./user');
db.Guest = require('./guest'); // ← بعد db ما تم تعريفه
db.Group = require('./group');
db.Room = require('./room');
db.Ban = require('./ban');
db.Wall = require('./wall');



// إضافة sequelize للكائن
db.sequelize = sequelize;


// العلاقات
db.User.belongsTo(db.Group, { foreignKey: 'groupId' });

module.exports = db;
