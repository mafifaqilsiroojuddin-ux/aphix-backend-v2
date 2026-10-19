// Endpoint: profil siswa, progress game, leaderboard
const express = require('express');
const router = express.Router();
const db = require('../lib/db');

// POST /api/players — daftar / ambil profil siswa {nama, hewan}
router.post('/', async (req, res) => {
  try {
    const { nama, hewan } = req.body || {};
    if (!nama || !String(nama).trim()) {
      return res.status(400).json({ error: 'Nama wajib diisi.' });
    }
    const p = await db.getOrCreatePlayer(String(nama).trim().slice(0, 50), hewan);
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/players/leaderboard/top?limit=5 — peringkat skor (untuk web utama)
//   ⚠ route ini harus didefinisikan SEBELUM /:nama agar "leaderboard" tidak terbaca sebagai nama
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    res.json(await db.getLeaderboard(limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/players/:nama — ambil progress 1 siswa
router.get('/:nama', async (req, res) => {
  try {
    const p = await db.getPlayer(req.params.nama);
    if (!p) return res.status(404).json({ error: 'Pemain tidak ditemukan.' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/players/:nama/progress — simpan progress
router.put('/:nama/progress', async (req, res) => {
  try {
    const p = await db.updateProgress(req.params.nama, req.body || {});
    if (!p) return res.status(404).json({ error: 'Pemain tidak ditemukan.' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
