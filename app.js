// =========================================================
// APHIX Backend — konfigurasi aplikasi Express
// Dipakai oleh server.js (lokal) dan api/[...slug].js (Vercel)
// =========================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

const origins = config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({ origin: origins }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// File PDF lokal (mode development) — di Vercel PDF disimpan di Supabase Storage
app.use('/uploads', express.static(config.UPLOAD_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'APHIX Backend', time: new Date().toISOString() }));
app.use('/api/players', require('./routes/players'));
app.use('/api/content', require('./routes/content'));
app.use('/api/books', require('./routes/books'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Terjadi kesalahan server.' });
});

module.exports = app;
