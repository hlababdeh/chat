const geoip = require("geoip-lite");

module.exports = function (req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const geo = geoip.lookup(ip);

  req.countryCode = geo && geo.country ? geo.country.toLowerCase() : 'unknown';
  next();
};
