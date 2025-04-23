const db = require('../models');

function hasPermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        return res.status(403).send('🚫 يجب تسجيل الدخول أولاً.');
      }

      const user = await db.User.findByPk(req.session.user.id, {
        include: db.Group
      });

      if (!user || !user.Group) {
        return res.status(403).send('🚫 لم يتم ربط المستخدم بأي مجموعة.');
      }

      const permissions = JSON.parse(user.Group.permissions || '{}');

      console.log("🧠 صلاحيات المستخدم:", permissions);
console.log("🔑 هل تحتوي:", permissionKey, '=>', permissions[permissionKey]);

      if (permissions[permissionKey]) {
        next();
      } else {
        res.status(403).send('🚫 ليس لديك صلاحية للوصول إلى هذه الصفحة.');
      }

    } catch (err) {
      console.error('⚠️ خطأ في التحقق من الصلاحية:', err);
      res.status(500).send('⚠️ حدث خطأ أثناء التحقق من الصلاحية.');
    }
  };
}

module.exports = hasPermission;
