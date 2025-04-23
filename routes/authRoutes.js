const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models');

// ✅ تسجيل عضوية جديدة
router.post('/register', async (req, res) => {
  const { username, password, fp } = req.body;

  try {
    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      return res.send(`
        <script>
          alert('❌ اسم المستخدم موجود مسبقاً.');
          window.location.href = '/';
        </script>
      `);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.User.create({
      username,
      password: hashedPassword,
      topic: username,
      pic: 'pic.png',
      token: require('crypto').randomUUID(),
      msg: '(عضو جديد)',
      rep: 0,
      muted: false,
      groupId: null
    });

    req.session.user = {
      id: newUser.idreg,
      username: newUser.username,
      groupId: newUser.groupId,
    };

    res.redirect('/chat');
  } catch (error) {
    res.status(500).send("خطأ في التسجيل: " + error.message);
  }
});

// ✅ تسجيل الدخول للعضو
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.User.findOne({ where: { username }, include: db.Group });
    if (!user) return res.send('اسم المستخدم أو كلمة المرور خاطئة.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('اسم المستخدم أو كلمة المرور خاطئة.');

    req.session.user = {
      id: user.idreg,
      username: user.username,
      groupId: user.groupId,
    };

    res.redirect('/chat');
  } catch (error) {
    res.status(500).send('حدث خطأ أثناء تسجيل الدخول.');
  }
});

// ✅ تسجيل دخول الزائر
router.post('/guest-login', async (req, res) => {
  const { guest_name } = req.body;

  try {
    // حذف الجلسات السابقة لنفس الاسم (يُسمح بالدخول بنفس الاسم)
    await db.Guest.destroy({ where: { guest_name } });

    const guest = await db.Guest.create({ guest_name });

    req.session.guest = {
      id: guest.id,
      guest_name: guest.guest_name,
    };

    res.redirect('/chat');
  } catch (error) {
    res.status(500).send("حدث خطأ أثناء تسجيل دخول الزائر: " + error.message);
  }
});

// ✅ تسجيل الخروج
router.post('/logout', async (req, res) => {
  if (req.session?.guest?.guest_name) {
    await db.Guest.destroy({ where: { guest_name: req.session.guest.guest_name } });
  }

  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// ✅ جلب بيانات المستخدم
router.get("/user/:uid", async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: req.params.uid } });
    if (user) {
      return res.json({
        username: user.username,
        avatar: user.avatar || "/uploads/default-avatar.png"
      });
    }
    res.status(404).json({ error: "المستخدم غير موجود" });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "خطأ في جلب البيانات" });
  }
});

module.exports = router;
