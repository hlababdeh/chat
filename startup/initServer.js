const http = require('http');
const app = require('../app');
const db = require('../models');
const socketHandlers = require('../sockets/socketHandlers');
const expressSession = require('../middleware/session');
const sharedSession = require('express-socket.io-session');

// ✅ تفعيل الجلسة أولاً
app.use(expressSession);

// ✅ بناء الخادم
const server = http.createServer(app);
const io = require('socket.io')(server);
app.set("io", io); // ✅ هذا هو الحل الجذري للمشكلة

// ✅ ربط الجلسة بـ Socket.io
io.use(sharedSession(expressSession));

// ✅ حماية الاتصال بـ Socket.io بناءً على الجلسة
io.use((socket, next) => {
  const session = socket.handshake.session;
  if (!session || (!session.user && !session.guest)) {
    return next(new Error("Unauthorized"));
  }
  next();
});

// ✅ تحميل أحداث Socket.io بعد الحماية
socketHandlers(io);

// ✅ تشغيل السيرفر
const PORT = 3000;
server.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database Connected Successfully!');
    await db.sequelize.sync({ alter: true });
  } catch (error) {
  }
});
