// =========================================================
// APHIX Backend — entry point untuk jalan LOKAL (VS Code)
// Jalankan:  npm install  lalu  npm start
// Untuk Vercel: gunakan api/[...slug].js (tidak perlu file ini)
// =========================================================
const app = require('./app');
const config = require('./config');

app.listen(config.PORT, () => {
  console.log('=============================================');
  console.log('  APHIX Backend berjalan di port ' + config.PORT);
  console.log('  Mode database: ' + (config.SUPABASE_URL ? 'Supabase (online)' : 'JSON file (lokal)'));
  console.log('  Cek: http://localhost:' + config.PORT + '/api/health');
  console.log('=============================================');
});
