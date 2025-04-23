const session = require('express-session');

const expressSession = session({
  secret: 'sahabi_super_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // ضروري false في التطوير
});

module.exports = expressSession;
