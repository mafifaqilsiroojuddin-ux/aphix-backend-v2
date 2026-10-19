// Endpoint: login admin & ganti sandi
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');
const config = require('../config');
const auth = require('../middleware/auth');

// Jika admin belum ada di DB, buat dari ADMIN_PASSWORD (pertama kali jalan)
async function pastikanAdminAda() {
  let hash = await db.getAdminHash();
  if (!hash) {
    hash = await bcrypt.hash(config.ADMIN_PASSWORD, 10);
    await db.setAdminHash(hash);
  }
  return hash;
}

// POST /api/admin/login — {password} -> {token}
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password wajib diisi.' });
    const hash = await pastikanAdminAda();
    const ok = await bcrypt.compare(String(password), hash);
    if (!ok) return res.status(401).json({ error: 'Password salah.' });
    const token = jwt.sign({ role: 'admin' }, config.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/admin/password — ganti sandi (admin) {newPassword}
router.put('/password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }
    const hash = await bcrypt.hash(String(newPassword), 10);
    await db.setAdminHash(hash);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
