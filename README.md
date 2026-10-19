# APHIX Backend + Database

> ## ⚡ REKOMENDASI: Online dengan **Vercel + Supabase** (Gratis, Tanpa Kartu Kredit)
>
> Karena Render sekarang minta kartu kredit, pakai kombinasi ini:
> - **Backend** → Vercel (sudah Anda deploy)
> - **Database + PDF** → Supabase (PostgreSQL + Storage, gratis, tanpa kartu)
>
> ### Langkah (10 menit):
> 1. **Daftar Supabase** → https://supabase.com → **New Project** → region pilih **Singapore** → tunggu sampai siap.
> 2. **Buat tabel**: menu kiri **SQL Editor** → tempel isi file `schema.sql` → **Run**.
> 3. **Buat tempat PDF**: menu **Storage** → **New bucket** → nama `pdfs` → centang **Public bucket** → Create.
> 4. **Copy 2 kunci**: **Project Settings → API** → copy `Project URL` dan `service_role` (jangan `anon`).
> 5. **Vercel** → project Anda → **Settings → Environment Variables** → tambahkan:
>    - `SUPABASE_URL` = (Project URL dari langkah 4)
>    - `SUPABASE_SERVICE_KEY` = (service_role dari langkah 4)
>    - `SUPABASE_BUCKET` = `pdfs`
>    - `JWT_SECRET` = sembarang kalimat panjang
>    - `ADMIN_PASSWORD` = sandi admin Anda (minimal 6 karakter)
>    - `CORS_ORIGIN` = alamat 3 web Netlify Anda, dipisah koma (cth: `https://web-utama.netlify.app,https://web-kedua.netlify.app,https://web-ketiga.netlify.app`)
> 6. **Upload ulang kode versi baru ini** (folder `aphix-backend` yang ada folder `api/` + file `vercel.json`) ke Vercel → **Redeploy**.
> 7. Tes: buka `https://aphix-backend.vercel.app/api/health` → harus muncul `{"ok":true,...}`.
>
> Setelah itu data siswa, buku, dan PDF tersimpan **permanen** di Supabase. ✅

---

Backend untuk 3 website APHIX (Apip History Xperience) yang saling terhubung:
1. **Web Utama** — hub / launcher (bisa menampilkan leaderboard)
2. **Web Kedua** — Game Deduksi Sejarah (profil siswa, skor, progress, pencapaian)
3. **Web Ketiga** — Hologram Book / Arsip (CRUD buku + upload PDF, login admin)

> Karena website Anda di-host di **Netlify** (static hosting, tidak bisa menjalankan server), backend ini berjalan terpisah. Frontend (3 HTML di Netlify) cukup memanggil API backend ini via `fetch()`.

---

## 1. Yang Anda butuhkan (install sekali)

- **Node.js** versi 18+ — unduh di https://nodejs.org (pilih LTS). Setelah install, buka Terminal/CMD dan ketik `node -v` untuk memastikan.
- **Visual Studio Code** — https://code.visualstudio.com

---

## 2. Cara menjalankan di VS Code (lokal)

1. Ekstrak file `aphix-backend.zip` ini.
2. Buka VS Code → **File → Open Folder** → pilih folder `aphix-backend`.
3. Buka Terminal di VS Code (menu **Terminal → New Terminal**).
4. Salin file konfigurasi:
   - Windows: `copy .env.example .env`
   - Mac/Linux: `cp .env.example .env`
5. (Opsional) Edit file `.env`: ganti `ADMIN_PASSWORD` dan `JWT_SECRET` dengan milik Anda.
6. Install dependencies (sekali saja):
   ```
   npm install
   ```
7. Jalankan server:
   ```
   npm start
   ```
   Akan muncul tulisan `APHIX Backend berjalan di port 3000`.
8. Tes di browser: buka http://localhost:3000/api/health — jika muncul `{"ok":true,...}` berarti berhasil.

> Untuk mode development (auto-restart saat edit kode): `npm run dev`

---

## 3. Daftar Endpoint API

Base URL lokal: `http://localhost:3000`
Base URL online (setelah deploy): `https://nama-anda.onrender.com`

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/api/health` | Cek server hidup | Publik |
| POST | `/api/players` | Daftar/ambil profil siswa `{nama, hewan}` | Publik |
| GET | `/api/players/:nama` | Ambil progress 1 siswa | Publik |
| PUT | `/api/players/:nama/progress` | Simpan progress `{poinTotal, levelTerbuka, levelSelesai, gelarTerakhir, hasilEvaluasi}` | Publik |
| GET | `/api/players/leaderboard/top` | Peringkat skor (untuk web utama) | Publik |
| GET | `/api/content` | Ambil bank soal (pertemuan & level) | Publik |
| PUT | `/api/content` | Simpan/edit bank soal | Admin |
| GET | `/api/books` | Daftar buku arsip (hologram) | Publik |
| POST | `/api/books` | Tambah buku + upload PDF (form-data) | Admin |
| PUT | `/api/books/:id` | Ubah buku (bisa ganti PDF) | Admin |
| DELETE | `/api/books/:id` | Hapus buku + PDF-nya | Admin |
| POST | `/api/admin/login` | Login admin `{password}` → dapat `token` | Publik |
| PUT | `/api/admin/password` | Ganti sandi admin | Admin |

Endpoint admin membutuhkan header: `Authorization: Bearer <token>` (token didapat dari login).

---

## 4. Cara deploy backend online (gratis) — Render

Agar 3 web Netlify Anda bisa memakai backend ini dari mana saja:

1. Upload folder `aphix-backend` ke **GitHub** (buat repo baru, push).
2. Daftar gratis di https://render.com → **New → Web Service** → pilih repo Anda.
3. Pengaturan:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Pilih plan **Free**.
4. Buka tab **Environment** → tambahkan variabel (sama seperti isi `.env`):
   - `JWT_SECRET` = kalimat rahasia panjang bebas
   - `ADMIN_PASSWORD` = sandi admin Anda
   - `CORS_ORIGIN` = alamat 3 web Netlify Anda, dipisah koma. Contoh:
     `https://aphix-utama.netlify.app,https://aphix-game.netlify.app,https://aphix-arsip.netlify.app`
5. Klik **Deploy**. Tunggu beberapa menit → Anda dapat URL seperti `https://aphix-backend.onrender.com`.
6. Ganti `BASE_URL` di frontend (lihat `INTEGRASI-FRONTEND.md`) dari `http://localhost:3000` menjadi URL Render Anda.

> ⚠️ **Catatan penting:** Paket gratis Render menghapus file yang di-upload (folder `uploads/`) setiap kali redeploy. Untuk PDF buku agar permanen, gunakan **Supabase Storage** atau **Cloudinary** (gratis). Simpan saja URL PDF-nya ke field `pdfUrl`. Struktur kode sudah mendukung `pdfUrl` apa pun.

---

## 5. Migrasi ke database sungguhan (PostgreSQL/Supabase)

Saat ini data disimpan di file JSON (folder `data/`) — cukup untuk belajar & skala kecil. Saat pengguna sudah banyak:
1. Daftar **Supabase** (gratis) → buat project → buka SQL Editor.
2. Jalankan isi file `schema.sql` (ada di folder ini) untuk membuat tabel.
3. Ubah `lib/db.js` agar memakai paket `pg` dan `DATABASE_URL` dari Supabase. Struktur endpoint (`routes/`) tidak perlu diubah.

---

## 6. Struktur folder

```
aphix-backend/
├── server.js            ← pintu masuk server
├── config.js            ← baca pengaturan dari .env
├── package.json
├── .env.example         ← salin jadi .env
├── schema.sql           ← skema PostgreSQL/Supabase (untuk nanti)
├── README.md            ← dokumen ini
├── INTEGRASI-FRONTEND.md ← cara sambungkan ke 3 HTML Anda
├── lib/db.js            ← lapisan database (JSON file)
├── middleware/auth.js   ← proteksi admin (JWT)
├── routes/
│   ├── players.js       ← profil, progress, leaderboard
│   ├── content.js       ← bank soal game
│   ├── books.js         ← arsip buku + upload PDF
│   └── admin.js         ← login admin
├── data/                ← database JSON (dibuat otomatis)
└── uploads/             ← file PDF (dibuat otomatis)
```

---

## 7. Troubleshooting

- **`npm install` gagal / lama**: pastikan Node.js versi 18+. Coba `npm install --registry=https://registry.npmjs.org`.
- **Port 3000 sudah dipakai**: ubah `PORT=3000` di `.env` menjadi `PORT=3001`.
- **Frontend tidak bisa akses API (error CORS)**: pastikan `CORS_ORIGIN` di `.env` / Render memuat alamat web Netlify Anda. Saat development boleh `*`.
- **Lupa sandi admin**: ubah `ADMIN_PASSWORD` di `.env`, hapus file `data/admin.json`, lalu restart server — sandi baru langsung aktif.
