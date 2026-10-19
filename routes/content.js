// Endpoint: bank soal game (pertemuan & level)
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const auth = require('../middleware/auth');

// GET /api/content — ambil bank soal (publik)
router.get('/', async (req, res) => {
  try {
    res.json(await db.getContent());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/content — simpan / edit bank soal (admin)
router.put('/', auth, async (req, res) => {
  try {
    res.json(await db.saveContent(req.body || {}));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
