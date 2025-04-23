const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { User, Guest } = require("../models");

// إعدادات التخزين للصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/avatars"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });
router.get("/settings/get", async (req, res) => {
  const sessionUser = req.session.user;
  const sessionGuest = req.session.guest;

  let model;
  let where;

  if (sessionUser) {
    model = User;
    where = { idreg: sessionUser.id }; // ✅ تم التعديل هنا
  } else if (sessionGuest) {
    model = Guest;
    where = { id: sessionGuest.id };
  } else {
    return res.status(401).json({ success: false, message: "غير مصرح" });
  }

  try {
    const user = await model.findOne({ where });

    if (!user) return res.status(404).json({ success: false });

    res.json({
      success: true,
      settings: {
        topic: user.topic,
        msg: user.msg,
        ucol: user.ucol,
        mcol: user.mcol,
        bg: user.bg,
        pic: user.pic
      }
    });
  } catch (err) {
    console.error("خطأ في get:", err);
    res.status(500).json({ success: false });
  }
});


// ✅ تحديث الإعدادات
router.post("/settings/update", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const sessionGuest = req.session.guest;
    const { topic, msg, ucol, mcol, bg } = req.body;

    if (sessionUser) {
      await User.update({ topic, msg, ucol, mcol, bg }, { where: { idreg: sessionUser.id } }); // ✅
    } else if (sessionGuest) {
      await Guest.update({ topic, msg, ucol, mcol, bg }, { where: { id: sessionGuest.id } });
    } else {
      return res.status(401).json({ success: false, message: "غير مسموح" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("خطأ أثناء تحديث الإعدادات:", err);
    res.status(500).json({ success: false });
  }
});


// ✅ رفع صورة جديدة
router.post("/settings/upload-pic", upload.single("image"), async (req, res) => {
  try {
    const { user, guest } = req.session;
    const fileName = req.file?.filename;

    if (!fileName) return res.status(400).json({ success: false, message: "الصورة غير مرفقة" });

    if (user?.id) {
      await User.update({ pic: fileName }, { where: { idreg: user.id } }); // ✅
    } else if (guest?.id) {
      await Guest.update({ pic: fileName }, { where: { id: guest.id } });
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ success: false, message: "غير مسموح" });
    }

    res.json({ success: true, fileName });
  } catch (err) {
    console.error("❌ خطأ في رفع الصورة:", err);
    res.status(500).json({ success: false });
  }
});


// ✅ حذف الصورة واسترجاع pic.png
router.delete("/settings/delete-pic", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const sessionGuest = req.session.guest;
    let model;
    let where;

    if (sessionUser) {
      model = User;
      where = { idreg: sessionUser.id }; // ✅
    } else if (sessionGuest) {
      model = Guest;
      where = { id: sessionGuest.id };
    } else {
      return res.status(401).json({ success: false, message: "غير مسموح" });
    }

    const user = await model.findOne({ where });
    if (user && user.pic && user.pic !== "pic.png") {
      const picPath = path.join(__dirname, "../public/uploads/avatars", user.pic);
      if (fs.existsSync(picPath)) fs.unlinkSync(picPath);
    }

    await model.update({ pic: "pic.png" }, { where });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ في حذف الصورة:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
