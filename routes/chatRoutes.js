// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const hasPermission = require('../middleware/hasPermission');

// عرض صفحة الدردشة
router.get('/chat', async (req, res) => {
    if (!req.session.user && !req.session.guest) {
      return res.redirect('/'); // 🔁 إعادة التوجيه إلى الصفحة الرئيسية
    }

    const rooms = await db.Room.findAll({ where: { deleted: false } });

    let permissions = {};
    if (req.session.user) {
        const user = await db.User.findByPk(req.session.user.id, {
            include: db.Group
        });

        if (user && user.Group) {
            permissions = JSON.parse(user.Group.permissions || '{}');
        }
    }

    res.render('chat', { rooms, permissions, user: req.session.user, guest: req.session.guest });

});



module.exports = router;
