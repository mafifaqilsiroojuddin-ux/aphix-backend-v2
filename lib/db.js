// =========================================================
// Lapisan database — DUAL MODE:
//  - Jika SUPABASE_URL & SUPABASE_SERVICE_KEY diisi  -> Supabase (PostgreSQL + Storage)
//  - Jika dikosongkan                                 -> file JSON lokal (belajar di laptop)
// =========================================================
const fs = require('fs');
const path = require('path');
const config = require('../config');

let supabase = null;
if (config.SUPABASE_URL && config.SUPABASE_SERVICE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
const useSupabase = !!supabase;

// ---------- helper JSON lokal ----------
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(config.DATA_DIR, file), 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJson(file, data) {
  if (!fs.existsSync(config.DATA_DIR)) fs.mkdirSync(config.DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.DATA_DIR, file), JSON.stringify(data, null, 2));
}
function nextId(list) {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

// ---------- mapping kolom snake_case (Supabase) <-> camelCase (API) ----------
function mapPlayer(p) {
  if (!p) return null;
  return {
    id: p.id,
    nama: p.nama,
    hewan: p.hewan || '🐱',
    poinTotal: p.poin_total ?? p.poinTotal ?? 0,
    levelTerbuka: p.level_terbuka ?? p.levelTerbuka ?? [1],
    levelTerbukaPertemuan: p.level_terbuka_pertemuan ?? p.levelTerbukaPertemuan ?? {},
    levelSelesai: p.level_selesai ?? p.levelSelesai ?? [],
    gelarTerakhir: p.gelar_terakhir ?? p.gelarTerakhir ?? '',
    hasilEvaluasi: p.hasil_evaluasi ?? p.hasilEvaluasi ?? {},
  };
}
function mapBook(b) {
  if (!b) return null;
  return {
    id: b.id,
    judul: b.judul,
    keterangan: b.keterangan ?? '',
    lat: b.lat ?? 0,
    lon: b.lon ?? 0,
    warna: b.warna ?? '#4dffe0',
    pdfUrl: b.pdf_url ?? b.pdfUrl ?? '',
  };
}

const db = {
  useSupabase,
  supabase, // dipakai routes/books.js untuk upload/hapus PDF di Storage
  bucket: config.SUPABASE_BUCKET,

  // ================= PLAYERS (siswa game) =================
  async getOrCreatePlayer(nama, hewan) {
    if (useSupabase) {
      let { data } = await supabase.from('players').select('*').eq('nama', nama).maybeSingle();
      if (!data) {
        const ins = await supabase
          .from('players')
          .insert({ nama, hewan: hewan || '🐱' })
          .select()
          .single();
        data = ins.data;
      }
      return mapPlayer(data);
    }
    const players = readJson('players.json', []);
    let p = players.find((x) => x.nama === nama);
    if (!p) {
      p = {
        id: nextId(players),
        nama,
        hewan: hewan || '🐱',
        poinTotal: 0,
        levelTerbuka: [1],
        levelSelesai: [],
        gelarTerakhir: '',
        hasilEvaluasi: {},
      };
      players.push(p);
      writeJson('players.json', players);
    }
    return p;
  },

  async getPlayer(nama) {
    if (useSupabase) {
      const { data } = await supabase.from('players').select('*').eq('nama', nama).maybeSingle();
      return mapPlayer(data);
    }
    const players = readJson('players.json', []);
    return players.find((x) => x.nama === nama) || null;
  },

  async updateProgress(nama, fields) {
    fields = fields || {};
    if (useSupabase) {
      const upd = { updated_at: new Date().toISOString() };
      if (fields.poinTotal !== undefined) upd.poin_total = fields.poinTotal;
      if (fields.levelTerbuka !== undefined) upd.level_terbuka = fields.levelTerbuka;
      if (fields.levelTerbukaPertemuan !== undefined) upd.level_terbuka_pertemuan = fields.levelTerbukaPertemuan;
      if (fields.levelSelesai !== undefined) upd.level_selesai = fields.levelSelesai;
      if (fields.gelarTerakhir !== undefined) upd.gelar_terakhir = fields.gelarTerakhir;
      if (fields.hasilEvaluasi !== undefined) upd.hasil_evaluasi = fields.hasilEvaluasi;
      const { data } = await supabase.from('players').update(upd).eq('nama', nama).select().single();
      return mapPlayer(data);
    }
    const players = readJson('players.json', []);
    const p = players.find((x) => x.nama === nama);
    if (!p) return null;
    ['poinTotal', 'levelTerbuka', 'levelTerbukaPertemuan', 'levelSelesai', 'gelarTerakhir', 'hasilEvaluasi'].forEach((k) => {
      if (fields[k] !== undefined) p[k] = fields[k];
    });
    writeJson('players.json', players);
    return p;
  },

  async getLeaderboard(limit) {
    limit = Math.max(1, Math.min(100, limit || 10));
    if (useSupabase) {
      const { data } = await supabase
        .from('players')
        .select('*')
        .order('poin_total', { ascending: false })
        .limit(limit);
      return (data || []).map((p, i) => ({ ...mapPlayer(p), rank: i + 1 }));
    }
    const players = readJson('players.json', []);
    return [...players]
      .sort((a, b) => (b.poinTotal || 0) - (a.poinTotal || 0))
      .slice(0, limit)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  // ================= CONTENT (bank soal game) =================
  async getContent() {
    if (useSupabase) {
      const { data } = await supabase.from('game_content').select('data').eq('id', 1).maybeSingle();
      return (data && data.data) || { pertemuan: [] };
    }
    return readJson('content.json', { pertemuan: [] });
  },

  async saveContent(data) {
    if (useSupabase) {
      await supabase
        .from('game_content')
        .upsert({ id: 1, data, updated_at: new Date().toISOString() });
      return data;
    }
    writeJson('content.json', data);
    return data;
  },

  // ================= BOOKS (arsip buku + PDF) =================
  async listBooks() {
    if (useSupabase) {
      const { data } = await supabase.from('books').select('*').order('id', { ascending: true });
      return (data || []).map(mapBook);
    }
    return readJson('books.json', []);
  },

  async getBook(id) {
    if (useSupabase) {
      const { data } = await supabase.from('books').select('*').eq('id', Number(id)).maybeSingle();
      return mapBook(data);
    }
    const books = readJson('books.json', []);
    return books.find((b) => b.id === Number(id)) || null;
  },

  async createBook(b) {
    if (useSupabase) {
      const { data } = await supabase
        .from('books')
        .insert({
          judul: b.judul,
          keterangan: b.keterangan || '',
          lat: b.lat ?? 0,
          lon: b.lon ?? 0,
          warna: b.warna || '#4dffe0',
          pdf_url: b.pdfUrl || '',
        })
        .select()
        .single();
      return mapBook(data);
    }
    const books = readJson('books.json', []);
    const nb = { id: nextId(books), ...b };
    books.push(nb);
    writeJson('books.json', books);
    return nb;
  },

  async updateBook(id, fields) {
    if (useSupabase) {
      const upd = { updated_at: new Date().toISOString() };
      if (fields.judul !== undefined) upd.judul = fields.judul;
      if (fields.keterangan !== undefined) upd.keterangan = fields.keterangan;
      if (fields.lat !== undefined) upd.lat = fields.lat;
      if (fields.lon !== undefined) upd.lon = fields.lon;
      if (fields.warna !== undefined) upd.warna = fields.warna;
      if (fields.pdfUrl !== undefined) upd.pdf_url = fields.pdfUrl;
      const { data } = await supabase.from('books').update(upd).eq('id', Number(id)).select().single();
      return mapBook(data);
    }
    const books = readJson('books.json', []);
    const b = books.find((x) => x.id === Number(id));
    if (!b) return null;
    Object.assign(b, fields);
    writeJson('books.json', books);
    return b;
  },

  async deleteBook(id) {
    if (useSupabase) {
      await supabase.from('books').delete().eq('id', Number(id));
      return true;
    }
    let books = readJson('books.json', []);
    books = books.filter((b) => b.id !== Number(id));
    writeJson('books.json', books);
    return true;
  },

  // ================= ADMIN =================
  async getAdminHash() {
    if (useSupabase) {
      const { data } = await supabase
        .from('admin')
        .select('password_hash')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data ? data.password_hash : null;
    }
    const a = readJson('admin.json', null);
    return a ? a.passwordHash : null;
  },

  async setAdminHash(hash) {
    if (useSupabase) {
      const { data } = await supabase
        .from('admin')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        await supabase.from('admin').update({ password_hash: hash }).eq('id', data.id);
      } else {
        await supabase.from('admin').insert({ password_hash: hash });
      }
      return true;
    }
    writeJson('admin.json', { passwordHash: hash });
    return true;
  },
};

module.exports = db;
