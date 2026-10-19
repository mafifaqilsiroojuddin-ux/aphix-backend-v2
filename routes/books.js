// Endpoint: arsip buku (Hologram Book) + upload PDF
// PDF disimpan di Supabase Storage (online) atau folder uploads/ (lokal).
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');
const config = require('../config');
const auth = require('../middleware/auth');

// Pakai memoryStorage agar bisa jalan di Vercel (disk serverless hanya sementara)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function sanitize(name) {
  return String(name || 'file.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

// Upload file PDF -> kembalikan URL publik (Supabase) atau path /uploads/... (lokal)
async function simpanPdf(file) {
  if (!file) return '';
  const namaFile = Date.now() + '-' + sanitize(file.originalname);
  if (db.useSupabase) {
    const { error } = await db.supabase.storage
      .from(db.bucket)
      .upload(namaFile, file.buffer, { contentType: file.mimetype || 'application/pdf', upsert: false });
    if (error) throw new Error('Gagal upload PDF ke Supabase: ' + error.message);
    const { data } = db.supabase.storage.from(db.bucket).getPublicUrl(namaFile);
    return data.publicUrl;
  }
  if (!fs.existsSync(config.UPLOAD_DIR)) fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.UPLOAD_DIR, namaFile), file.buffer);
  return '/uploads/' + namaFile;
}

// Hapus file PDF lama (saat buku diganti/dihapus)
async function hapusPdf(pdfUrl) {
  if (!pdfUrl) return;
  try {
    if (db.useSupabase) {
      const marker = '/public/' + db.bucket + '/';
      const idx = pdfUrl.indexOf(marker);
      const filePath = idx >= 0 ? decodeURIComponent(pdfUrl.slice(idx + marker.length)) : null;
      if (filePath) await db.supabase.storage.from(db.bucket).remove([filePath]);
    } else if (pdfUrl.startsWith('/uploads/')) {
      const fp = path.join(config.UPLOAD_DIR, path.basename(pdfUrl));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  } catch (e) {
    console.warn('Hapus PDF lama gagal (diabaikan):', e.message);
  }
}

function parseBuku(req) {
  return {
    judul: String(req.body.judul || '').trim() || 'Tanpa Judul',
    keterangan: String(req.body.keterangan || ''),
    lat: parseFloat(req.body.lat) || 0,
    lon: parseFloat(req.body.lon) || 0,
    warna: String(req.body.warna || '#4dffe0'),
  };
}

// GET /api/books — daftar buku (publik)
router.get('/', async (req, res) => {
  try {
    res.json(await db.listBooks());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/books — tambah buku + upload PDF (admin, FormData, field file: "pdf")
router.post('/', auth, upload.single('pdf'), async (req, res) => {
  try {
    const b = parseBuku(req);
    b.pdfUrl = await simpanPdf(req.file);
    res.json(await db.createBook(b));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/books/:id — ubah buku (bisa ganti PDF) (admin)
router.put('/:id', auth, upload.single('pdf'), async (req, res) => {
  try {
    const lama = await db.getBook(req.params.id);
    if (!lama) return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    const b = parseBuku(req);
    if (req.file) {
      b.pdfUrl = await simpanPdf(req.file);
      await hapusPdf(lama.pdfUrl);
    }
    res.json(await db.updateBook(req.params.id, b));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/books/:id — hapus buku + PDF-nya (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const lama = await db.getBook(req.params.id);
    if (lama) await hapusPdf(lama.pdfUrl);
    await db.deleteBook(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
