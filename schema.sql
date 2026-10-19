-- =========================================================
-- Skema SQL (PostgreSQL / Supabase) — dipakai saat Anda
-- pindah dari file JSON lokal ke database online.
-- Jalankan SQL ini di Supabase / Neon / Render PostgreSQL.
-- =========================================================

CREATE TABLE IF NOT EXISTS players (
  id          SERIAL PRIMARY KEY,
  nama        TEXT UNIQUE NOT NULL,
  hewan       TEXT DEFAULT '🐱',
  poin_total  INTEGER DEFAULT 0,
  level_terbuka JSONB DEFAULT '[1]',
  level_terbuka_pertemuan JSONB DEFAULT '{}',
  level_selesai JSONB DEFAULT '[]',
  gelar_terakhir TEXT DEFAULT '',
  hasil_evaluasi JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id          SERIAL PRIMARY KEY,
  judul       TEXT NOT NULL,
  keterangan  TEXT DEFAULT '',
  lat         REAL DEFAULT 0,
  lon         REAL DEFAULT 0,
  warna       TEXT DEFAULT '#4dffe0',
  pdf_url     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Konten game (pertemuan & level) disimpan sebagai 1 dokumen
CREATE TABLE IF NOT EXISTS game_content (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin (
  id            SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL
);
