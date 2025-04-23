const geoip = require('geoip-lite');
const db = require('../models');
const { Op } = require('sequelize');

module.exports = async function (req, res, next) {
  const ip = req.ip;
  const geo = geoip.lookup(ip);
  const country = geo ? geo.country : '';
  const deviceId = req.cookies.device_id || '';
  const username = req.session.user ? req.session.user.username : '';

  try {
    const bans = await db.Ban.findAll({
      where: {
        [Op.or]: [
          { ip_band: ip },
          { country_band: country },
          { device_band: deviceId },
          { decoderDans: username },
        ],
      },
    });

    if (bans.length > 0) {
      return res.status(403).send(`🚫 تم حظرك. السبب: ${bans[0].name_band || 'غير محدد'}`);
    }

    next();
  } catch (err) {
    console.error('خطأ أثناء فحص الحظر:', err);
    res.status(500).send('⚠️ حدث خطأ أثناء التحقق من الحظر.');
  }
};
