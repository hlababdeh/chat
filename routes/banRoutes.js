// routes/banRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const hasPermission = require('../middleware/hasPermission');

// عرض الحظر
router.get('/', hasPermission('can_access_admin'), async (req, res) => {
    const bans = await db.Ban.findAll();
    res.render('bans', { bans });
});

// إضافة حظر
router.post('/add', hasPermission('can_access_admin'), async (req, res) => {
    await db.Ban.create(req.body);
    res.redirect('/admin/bans');
});

// حذف حظر
router.get('/delete/:id', hasPermission('can_access_admin'), async (req, res) => {
    await db.Ban.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/bans');
});

module.exports = router;
