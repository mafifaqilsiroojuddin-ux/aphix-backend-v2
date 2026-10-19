// =========================================================
// Pintu masuk VERCEL (serverless function).
// Semua request /api/* diarahkan ke sini lewat vercel.json.
// Body parser bawaan Vercel DIMATIKAN agar multer (upload PDF)
// dan express.json() bisa memproses body mentah.
// =========================================================
const app = require('../app');

const handler = (req, res) => app(req, res);

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
