require('dotenv').config();
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3098;
const SERVICE_KEY = process.env.SERVICE_KEY;
const PEPPER_VALUE = process.env.PEPPER_VALUE;

if (!SERVICE_KEY || !PEPPER_VALUE) {
  console.error('[Pepper Primary] SERVICE_KEY et PEPPER_VALUE requis dans .env');
  process.exit(1);
}

function safeCompare(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/pepper') {
    const key = req.headers['x-service-key'];

    if (!key || !safeCompare(key, SERVICE_KEY)) {
      res.writeHead(403);
      return res.end(JSON.stringify({ error: 'Forbidden' }));
    }

    res.writeHead(200);
    return res.end(JSON.stringify({ pepper: PEPPER_VALUE }));
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'ok', service: 'pepper-primary' }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[Pepper Primary] Port ${PORT}`);
});
