// ✅ راوتر الحائط - routes/wall.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const { Op } = require("sequelize");
// ✅ استدعاء موديل Wall من Sequelize
const { Wall } = require("../models");

// ✅ حذف منشورات الحائط الأقدم من 24 ساعة + حذف ملفاتها
cron.schedule("0 * * * *", async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const oldPosts = await db.Wall.findAll({
      where: {
        createdAt: {
          [Op.lt]: cutoff
        }
      }
    });

    for (const post of oldPosts) {
      if (post.pic) {
        const filePath = path.join(__dirname, "../public", post.pic);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await post.destroy();
    }

    if (oldPosts.length > 0) {
      console.log(`🧹 حذف ${oldPosts.length} منشور (مع الملفات)`);
    }
  } catch (err) {
    console.error("❌ خطأ في الحذف التلقائي للمنشورات:", err);
  }
});

// إعداد multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/", "video/", "audio/"];
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm", ".ogg", ".mp3", ".wav"];

    const mimeOk = allowedMimes.some(type => file.mimetype.startsWith(type));
    const ext = path.extname(file.originalname).toLowerCase();
    const extOk = allowedExts.includes(ext);

    if (mimeOk && extOk) {
      cb(null, true); // ✅ الملف مقبول
    } else {
      cb(null, false); // ⛔ مرفوض
    }
  }
});
// إرسال منشور
router.post("/Wall", upload.single("media"), async (req, res) => {
  try {
    const { msg } = req.body;
    const uid = req.session?.user?.id || req.session?.guest?.id || req.body.uid;
    const sender = req.session?.user || req.session?.guest;
    const file = req.file;

    if (!msg && !file) return res.status(400).json({ error: "المحتوى فارغ" });

    const mediaPath = file ? `/uploads/${file.filename}` : null;

    const newPost = await db.Wall.create({
      msg,
      pic: mediaPath,
      uid,
      username: sender?.username || sender?.guest_name || "مستخدم",
      likes: "[]",
      bcc: "[]",
    });

    req.app?.get("io")?.emit("msg", {
      cmd: "wall_post",
      data: {
        id: newPost.id, // 👈 مهم جداً
        msg: newPost.msg,
        pic: newPost.pic,
        uid: newPost.uid,
        createdAt: newPost.createdAt,
        username: newPost.username,
        avatar: sender?.pic || "/uploads/default-avatar.png"
      },
    });

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Wall POST error:", err);
    res.status(500).json({ error: "فشل في إنشاء المنشور" });
  }
});


// جلب المنشورات مع دعم lastDate بدلاً من offset
router.get("/Wall", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const lastDate = req.query.lastDate ? new Date(req.query.lastDate) : null;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 ساعة

    const where = {
      createdAt: {
        [Op.gt]: cutoff,
      }
    };

    if (lastDate) {
      where.createdAt[Op.lt] = lastDate; // فقط الأقدم من آخر منشور ظاهر
    }

    const posts = await db.Wall.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
    });

    res.json(posts);
  } catch (err) {
    console.error("Wall GET error:", err);
    res.status(500).json({ error: "فشل في جلب المنشورات" });
  }
});


router.delete("/Wall/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    const deleted = await Wall.destroy({ where: { id: postId } });

    if (deleted) {
      req.app.get("io").emit("msg", {
        cmd: "wall_delete",
        id: postId
      });
      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (err) {
    console.error("❌ خطأ عند حذف منشور:", err);
    return res.sendStatus(500);
  }
});

router.post("/Wall/like/:id", async (req, res) => {
  try {
    const wallId = req.params.id;
    const uid = req.session.user?.id || req.session.guest?.id;

    const wall = await Wall.findByPk(wallId);
    if (!wall) return res.status(404).json({ message: "المنشور غير موجود" });

    // نحول النص لمصفوفة
    let likes = [];
    try {
      likes = JSON.parse(wall.likes || "[]");
    } catch (e) {
      likes = [];
    }

    // إذا كان عامل لايك نشيله، إذا ما عامل لايك نضيفه
    if (likes.includes(uid)) {
      likes = likes.filter((id) => id !== uid);
    } else {
      likes.push(uid);
    }

    wall.likes = JSON.stringify(likes);
    await wall.save();

    // ✅ بث التحديث لجميع المستخدمين
    const io = req.app.get("io");
    io.emit("msg", {
      cmd: "wall_like",
      data: { id: wall.id, likes },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error in like:", err);
    res.status(500).json({ message: "فشل في تسجيل الإعجاب" });
  }
});



router.post("/Wall/comment/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const uid = req.session?.user?.id || req.session?.guest?.id;
    const sender = req.session?.user || req.session?.guest;

    if (!text || !uid) return res.status(400).json({ error: "تعليق غير صالح" });

    const post = await db.Wall.findByPk(postId);
    if (!post) return res.status(404).json({ error: "المنشور غير موجود" });

    const comments = JSON.parse(post.bcc || "[]");

    comments.push({
      text,
      uid,
      username: sender?.username || sender?.guest_name || "مستخدم",
      avatar: sender?.pic || "/uploads/default-avatar.png",
      time: new Date().toISOString()
    });

    post.bcc = JSON.stringify(comments);
    await post.save();

    // إرسال التحديث عبر socket
    req.app.get("io").emit("msg", {
      cmd: "wall_comment",
      data: {
        postId,
        comment: comments[comments.length - 1],
        postUid: post.uid // ✅ ضيف هاي
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("خطأ في إرسال تعليق:", err);
    res.status(500).json({ error: "فشل في إضافة التعليق" });
  }
});



module.exports = router;
