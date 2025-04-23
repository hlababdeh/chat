const express = require('express');
const router = express.Router();
const db = require('../models');
const hasPermission = require('../middleware/hasPermission');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// عرض الغرف
router.get('/admin/rooms', hasPermission('can_access_admin'), async (req, res) => {
  const rooms = await db.Room.findAll({ where: { deleted: false } });
  res.render('rooms', { rooms });
});

// تعديل غرفة
router.get('/admin/rooms/edit/:idroom', hasPermission('can_access_admin'), async (req, res) => {
  const room = await db.Room.findByPk(req.params.idroom);
  res.render('edit-room', { room });
});

router.post('/admin/rooms/edit/:idroom', hasPermission('can_access_admin'), upload.single('pic'), async (req, res) => {
  const updateData = {
    topic: req.body.topic,
    about: req.body.about,
    collor: req.body.collor,
    welcome: req.body.welcome,
    max: req.body.max || 0,
    needpass: req.body.needpass === 'on',
  };

  if (req.body.pass && req.body.pass.trim() !== '') {
    updateData.pass = req.body.pass;
  }

  if (req.file) {
    updateData.pic = req.file.filename;
  }

  await db.Room.update(updateData, { where: { idroom: req.params.idroom } });
  res.redirect('/admin/rooms');
});

// حذف غرفة
router.get('/admin/rooms/delete/:idroom', hasPermission('can_access_admin'), async (req, res) => {
  await db.Room.destroy({ where: { idroom: req.params.idroom } });
  res.redirect('/admin/rooms');
});

module.exports = router;
