const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('hashim_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // لمنع إظهار الاستعلامات في الكونسول
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('تم الاتصال بنجاح مع قاعدة البيانات.');
  } catch (error) {
    console.error('فشل الاتصال:', error);
  }
})();

module.exports = sequelize;
