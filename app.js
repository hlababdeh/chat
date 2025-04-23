const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const banCheck = require('./middleware/banCheck');
const hasPermission = require('./middleware/hasPermission');

const geoMiddleware = require('./middleware/geoMiddleware');
app.use(geoMiddleware);

// ✅ الجلسة من ملف موحّد
const expressSession = require('./middleware/session');
app.use(expressSession);

// 📁 Static Files
app.use('/uploads', express.static('uploads'));

app.use(express.static(path.join(__dirname, 'public')));

// 📦 Middlewares
app.use(cookieParser());
app.use(banCheck);

// 🛠️ View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔤 Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 🧠 Session to Views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// 🌐 Routes

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.render('index');
});

require('./routes')(app);

// Admin Panel
app.get('/admin', hasPermission('can_access_admin'), (req, res) => {
  res.render('admin-panel', { admin: req.session.user });
});

module.exports = app;
