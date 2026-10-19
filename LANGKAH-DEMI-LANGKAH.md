# PANDUAN LANGKAH DEMI LANGKAH — APHIX (3 Web + Database + PDF)
> Untuk pemula, pakai VSCode. Total ±30 menit. Semua layanan GRATIS (tanpa kartu kredit).

## Yang dibutuhkan (install sekali)
1. **Node.js 18+** → https://nodejs.org (pilih yang LTS). Cek: buka Terminal/CMD, ketik `node -v` → harus muncul angka v18 atau lebih.
2. **Visual Studio Code** → https://code.visualstudio.com
3. Akun **GitHub** → https://github.com (gratis, untuk upload kode)
4. Akun **Supabase** → https://supabase.com (pakai login GitHub)
5. Akun **Vercel** → https://vercel.com (pakai login GitHub)

---

## TAHAP 1 — Siapkan proyek di VS Code (5 menit)
1. Ekstrak file `aphix-backend.zip` yang saya berikan.
2. Buka VS Code → **File → Open Folder** → pilih folder `aphix-backend`.
3. Buka Terminal di dalam VS Code: menu **Terminal → New Terminal**.
4. Salin file konfigurasi (ketik di Terminal):
   - Windows: `copy .env.example .env`
   - Mac/Linux: `cp .env.example .env`
5. Buka file `.env` (di VS Code, klik di panel kiri). Ganti 2 baris ini:
   - `ADMIN_PASSWORD=aphix123` → ganti `aphix123` dengan sandi admin Anda sendiri (minimal 6 karakter). Ini untuk masuk ke menu "KELOLA ARSIP" di web ketiga.
   - `JWT_SECRET=...` → ganti dengan sembarang kalimat panjang (misal `aphix-rahasia-saya-2026-abcdef`).
   - Biarkan `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` KOSONG dulu (nanti diisi di Tahap 3).
6. Install dependensi (sekali saja, tunggu sampai selesai):
   ```
   npm install
   ```
7. Jalankan server lokal:
   ```
   npm start
   ```
   Muncul tulisan `APHIX Backend berjalan di port 3000`.
8. Tes: buka browser → http://localhost:3000/api/health → muncul `{"ok":true,...}` berarti BERHASIL.
   (Untuk menghentikan server: tekan `Ctrl + C` di Terminal.)

---

## TAHAP 2 — Buat Database & Tempat PDF di Supabase (10 menit)
1. Login ke https://supabase.com → klik **New Project**.
   - Organization: pilih yang ada / buat baru.
   - Name: `aphix` (bebas).
   - Database Password: buat sandi, **catat/simpan** (tidak perlu diingat terus).
   - Region: pilih **Singapore** (paling dekat dengan Indonesia).
   - Klik **Create new project** → tunggu ±2 menit sampai siap.
2. **Buat tabel database:**
   - Menu kiri → **SQL Editor** → klik **+ New query**.
   - Buka file `schema.sql` dari folder proyek (di VS Code), **copy semua isinya**, tempel di kotak SQL Editor Supabase.
   - Klik **Run** (atau tekan `Ctrl+Enter`). Muncul "Success. No rows returned" → tabel jadi.
3. **Buat tempat penyimpanan PDF (Storage bucket):**
   - Menu kiri → **Storage** → klik **New bucket**.
   - Name: `pdfs` (huruf kecil persis).
   - Centang **Public bucket** → klik **Create**.
4. **Ambil 2 kunci rahasia:**
   - Menu kiri paling bawah → **Project Settings** → **API**.
   - Copy nilai **Project URL** (contoh: `https://abcxyz.supabase.co`) → simpan di notepad.
   - Di bagian **Project API keys**, copy yang bernama **service_role** (bukan `anon`!) → simpan di notepad.
     ⚠️ `service_role` itu rahasia — jangan dibagikan / jangan dimasukkan ke file HTML.

---

## TAHAP 3 — Upload backend ke GitHub + Deploy ke Vercel (10 menit)
### 3a. Upload ke GitHub
1. Buka https://github.com/new → buat repository baru:
   - Repository name: `aphix-backend`
   - Pilih **Public** atau Private (keduanya bisa).
   - Jangan centang "Add README". Klik **Create repository**.
2. Kembali ke VS Code, pastikan server sudah dihentikan (`Ctrl+C`).
3. Di Terminal VS Code, ketik satu per satu (ganti `USERNAME` dengan username GitHub Anda):
   ```
   git init
   git add .
   git commit -m "backend aphix"
   git branch -M main
   git remote add origin https://github.com/USERNAME/aphix-backend.git
   git push -u origin main
   ```
   Jika diminta login GitHub, ikuti petunjuk (biasanya perlu install "GitHub CLI" atau login via browser).

### 3b. Deploy ke Vercel
1. Login ke https://vercel.com → klik **Add New… → Project**.
2. Pilih repository `aphix-backend` → klik **Import**.
3. Di halaman konfigurasi, bagian **Environment Variables**, tambahkan SATU PER SATU (klik Add setelah masing-masing):
   | NAME | VALUE |
   |---|---|
   | `SUPABASE_URL` | (Project URL dari Tahap 2 no.4) |
   | `SUPABASE_SERVICE_KEY` | (service_role dari Tahap 2 no.4) |
   | `SUPABASE_BUCKET` | `pdfs` |
   | `JWT_SECRET` | (kalimat rahasia yang sama dengan di file .env) |
   | `ADMIN_PASSWORD` | (sandi admin yang sama dengan di file .env) |
   | `CORS_ORIGIN` | `*` (bintang saja dulu, nanti diganti alamat web Anda) |
4. Klik **Deploy**. Tunggu ±1 menit.
5. Setelah selesai, Anda dapat URL seperti `https://aphix-backend-xxxx.vercel.app`. **Catat URL ini.**
6. Tes: buka `https://URL-ANDA.vercel.app/api/health` → muncul `{"ok":true,...}` → backend ONLINE.
   (Catat juga: mode database sekarang otomatis pakai Supabase, karena SUPABASE_URL sudah diisi.)

---

## TAHAP 4 — Sambungkan 3 Web Anda ke backend (5 menit)
Lihat file **`INTEGRASI-FRONTEND.md`** di folder proyek untuk potongan kode lengkap. Intinya:
1. Di SETIAP file HTML (web-utama, web-kedua, web-ketiga), di bagian awal `<script>`, ganti:
   ```js
   const API_BASE = "http://localhost:3000";
   ```
   menjadi URL Vercel Anda:
   ```js
   const API_BASE = "https://aphix-backend-xxxx.vercel.app";
   ```
2. Tempel fungsi `api()` dan potongan kode sesuai masing-masing web (lihat `INTEGRASI-FRONTEND.md`):
   - **Web Kedua (game):** ganti penyimpanan `localStorage` profil & progress → panggil `api("/api/players", ...)` dan `simpanProgressKeServer()`.
   - **Web Ketiga (arsip buku):** muat buku dari `api("/api/books")`, login admin via `api("/api/admin/login")`, upload PDF pakai `FormData`.
   - **Web Utama (hub):** tampilkan leaderboard dari `api("/api/players/leaderboard/top?limit=5")`.
3. Upload ulang 3 file HTML ke Netlify (atau hosting Anda).
4. Terakhir: di Vercel → **Settings → Environment Variables**, ubah `CORS_ORIGIN` dari `*` menjadi alamat 3 web Anda dipisah koma, contoh:
   ```
   https://web-utama.netlify.app,https://web-kedua.netlify.app,https://web-ketiga.netlify.app
   ```
   Lalu **Redeploy** (Vercel akan otomatis minta redeploy setelah ubah env vars).

---

## Selesai! Yang Anda dapatkan:
- ✅ 3 web saling terhubung ke 1 database (Supabase PostgreSQL) — data siswa, skor, progress tersimpan permanen.
- ✅ PDF buku tersimpan aman di Supabase Storage (tidak hilang saat redeploy).
- ✅ Backend API online 24 jam di Vercel (gratis).
- ✅ Login admin untuk kelola arsip buku (tambah/ubah/hapus + upload PDF).

## Jika ada error
- **`npm install` gagal:** pastikan Node.js versi 18+ (`node -v`). Coba tutup-buka VS Code.
- **Web tidak bisa akses API (error CORS):** pastikan `CORS_ORIGIN` di Vercel memuat alamat web Anda. Saat testing boleh `*`.
- **Upload PDF gagal:** pastikan bucket di Supabase bernama `pdfs` dan dicentang **Public**, serta `SUPABASE_SERVICE_KEY` yang dipakai (bukan `anon`).
- **Lupa sandi admin:** ubah `ADMIN_PASSWORD` di Vercel Environment Variables → Redeploy. Lalu di Supabase **SQL Editor** jalankan: `DELETE FROM admin;` (admin baru akan dibuat otomatis saat login pertama dengan sandi baru).
