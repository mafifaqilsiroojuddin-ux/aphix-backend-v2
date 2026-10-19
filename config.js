require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_jwt_aphix_ganti_nanti',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'aphix123',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATA_DIR: __dirname + '/data',
  UPLOAD_DIR: __dirname + '/uploads',
  // --- Supabase (untuk deploy online / Vercel) ---
  // Jika kedua variabel ini diisi, otomatis pakai Supabase (PostgreSQL + Storage).
  // Jika kosong, pakai penyimpanan file JSON lokal (untuk development di laptop).
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'pdfs',
};
