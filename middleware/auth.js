// Middleware proteksi endpoint admin — butuh header: Authorization: Bearer <token>
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token tidak ada. Login dulu sebagai admin.' });
  try {
    req.admin = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};
