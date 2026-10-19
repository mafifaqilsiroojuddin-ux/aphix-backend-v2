# Panduan Integrasi Frontend (3 Web Anda) → Backend

Intinya: ganti pemakaian `localStorage` dengan panggilan `fetch()` ke backend.
`localStorage` tetap dipakai sebagai **cache offline** (jika server lambat/mati, data tidak hilang).

---

## 0. Konfigurasi dasar (tempel di SEMUA web, di awal `<script>`)

```html
<script>
// Ganti dengan URL Render Anda setelah deploy
const API_BASE = "http://localhost:3000";

async function api(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
    });
    return await res.json();
  } catch (e) {
    console.warn("API gagal, pakai cache lokal:", e);
    return null; // fallback ke localStorage
  }
}
</script>
```

---

## 1. Web Kedua — Game Deduksi Sejarah

Variabel yang dipakai web Anda: `Profil = {nama, hewan}` dan `Simpanan = {poinTotal, levelTerbuka, levelSelesai, gelarTerakhir, hasilEvaluasi}`.

### Saat pemain masukkan nama (ganti bagian yang menyimpan `profilDeduksi`):

```javascript
// Setelah pemain isi nama & pilih hewan:
const hasil = await api("/api/players", {
  method: "POST",
  body: { nama: Profil.nama, hewan: Profil.hewan },
});
if (hasil) {
  // Sinkronkan progress dari server (jika pernah main di perangkat lain)
  Simpanan.poinTotal     = hasil.poinTotal     ?? Simpanan.poinTotal;
  Simpanan.levelTerbuka  = hasil.levelTerbuka  ?? Simpanan.levelTerbuka;
  Simpanan.levelSelesai  = hasil.levelSelesai  ?? Simpanan.levelSelesai;
  Simpanan.gelarTerakhir = hasil.gelarTerakhir ?? Simpanan.gelarTerakhir;
  Simpanan.hasilEvaluasi = hasil.hasilEvaluasi ?? Simpanan.hasilEvaluasi;
}
// localStorage tetap disimpan sebagai cache
localStorage.setItem("profilDeduksi", JSON.stringify(Profil));
```

### Setiap kali progress berubah (selesai level, dapat poin, dll.) — panggil fungsi ini:

```javascript
async function simpanProgressKeServer() {
  if (!Profil.nama) return;
  await api("/api/players/" + encodeURIComponent(Profil.nama) + "/progress", {
    method: "PUT",
    body: {
      poinTotal: Simpanan.poinTotal,
      levelTerbuka: Simpanan.levelTerbuka,
      levelSelesai: Simpanan.levelSelesai,
      gelarTerakhir: Simpanan.gelarTerakhir,
      hasilEvaluasi: Simpanan.hasilEvaluasi,
    },
  });
  localStorage.setItem("gameDeduksiSejarah", JSON.stringify(Simpanan)); // cache
}
// Contoh pemakaian: setelah menjawab benar → tambah poin → panggil simpanProgressKeServer();
```

### (Opsional) Bank soal dari server — ganti `DATA_PERTEMUAN`:

```javascript
const konten = await api("/api/content");
if (konten && konten.pertemuan && konten.pertemuan.length) {
  DATA_PERTEMUAN = konten.pertemuan; // soal bisa diedit admin dari server
}
```

---

## 2. Web Ketiga — Hologram Book (Arsip + Admin)

### Saat halaman dibuka — muat daftar buku dari server:

```javascript
let ADMIN_TOKEN = localStorage.getItem("aphix_admin_token") || "";

async function muatBukuDariServer() {
  const bukuList = await api("/api/books");
  if (bukuList && Array.isArray(bukuList)) {
    // Timpa buku custom dengan data server.
    // Struktur: { id, judul, keterangan, lat, lon, warna, pdfUrl }
    // → sesuaikan dengan format buku di kode Anda (judul→title, keterangan→desc, pdfUrl→pdf)
    window.DAFTAR_BUKU_SERVER = bukuList.map(b => ({
      id: b.id,
      title: b.judul,
      desc: b.keterangan,
      lat: b.lat, lon: b.lon,
      color: b.warna,
      pdf: b.pdfUrl ? API_BASE + b.pdfUrl : "",
    }));
    renderBukuKeGlobe(window.DAFTAR_BUKU_SERVER); // ← nama fungsi menyesuaikan kode Anda
  }
}
muatBukuDariServer();
```

### Ganti kunci sandi "KELOLA ARSIP" — verifikasi ke server:

```javascript
// Ganti bagian yang memeriksa sandi hardcoded dengan:
async function loginAdmin(sandi) {
  const hasil = await api("/api/admin/login", { method: "POST", body: { password: sandi } });
  if (hasil && hasil.token) {
    ADMIN_TOKEN = hasil.token;
    localStorage.setItem("aphix_admin_token", ADMIN_TOKEN);
    return true;
  }
  return false;
}
```

### Simpan buku (tambah/ubah) — termasuk upload PDF:

```javascript
async function simpanBuku(idBuku, dataForm) {
  // dataForm: { judul, keterangan, lat, lon, warna, filePdf (File object atau null) }
  const fd = new FormData();
  fd.append("judul", dataForm.judul);
  fd.append("keterangan", dataForm.keterangan);
  fd.append("lat", dataForm.lat);
  fd.append("lon", dataForm.lon);
  fd.append("warna", dataForm.warna);
  if (dataForm.filePdf) fd.append("pdf", dataForm.filePdf);

  const url = idBuku ? "/api/books/" + idBuku : "/api/books";
  const method = idBuku ? "PUT" : "POST";
  const hasil = await fetch(API_BASE + url, {
    method,
    headers: { Authorization: "Bearer " + ADMIN_TOKEN }, // JANGAN pakai Content-Type JSON untuk FormData
    body: fd,
  }).then(r => r.json());

  if (hasil && hasil.id) muatBukuDariServer(); // refresh tampilan
}
```

### Hapus buku:

```javascript
async function hapusBuku(idBuku) {
  await fetch(API_BASE + "/api/books/" + idBuku, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + ADMIN_TOKEN },
  });
  muatBukuDariServer();
}
```

> Catatan: di kode web ketiga Anda saat ini data buku disimpan di `localStorage` dengan key `STORAGE_KEY` (struktur `{overrides, custom, deleted}`). Setelah integrasi, cukup **abaikan localStorage untuk buku** dan pakai `window.DAFTAR_BUKU_SERVER` di atas sebagai sumber data.

---

## 3. Web Utama — Hub / Launcher (tampilkan leaderboard)

```javascript
async function tampilkanLeaderboard() {
  const top = await api("/api/players/leaderboard/top?limit=5");
  if (top && top.length) {
    const html = top.map(p =>
      `<div>#${p.rank} ${p.hewan} ${p.nama} — ${p.poinTotal} poin</div>`
    ).join("");
    document.getElementById("leaderboard").innerHTML = html;
  }
}
```

---

## 4. Langkah terakhir setelah deploy backend ke Render

1. Ganti `API_BASE` di ketiga web dari `http://localhost:3000` → `https://aphix-backend-anda.onrender.com`.
2. Di pengaturan Render → Environment → `CORS_ORIGIN` isi alamat 3 web Netlify Anda (dipisah koma).
3. Upload ulang 3 file HTML ke Netlify → selesai, semua web sekarang terhubung ke 1 database & backend yang sama.
