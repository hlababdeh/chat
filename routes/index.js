// routes/index.js
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  const routesPath = __dirname;

  fs.readdirSync(routesPath).forEach((file) => {
    const filePath = path.join(routesPath, file);

    // نتجاهل ملف index.js نفسه
    if (file === 'index.js') return;

    // التأكد أن الملف عبارة عن Router
    const route = require(filePath);
    if (typeof route === 'function' && route.stack) {
      app.use('/', route);
    } else {
      console.warn(`⚠️ الملف ${file} لا يحتوي على Router صحيح. تأكد من تصدير router باستخدام: module.exports = router;`);
    }
  });
};
