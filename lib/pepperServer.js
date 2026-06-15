// Serveur HTTP minimal pour exposer le pepper
// GET /pepper (avec X-Service-Key) et GET /health

const http = require('http');
const crypto = require('crypto');

// Compare deux chaînes sans fuite de timing
function safeCompare(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Envoie une réponse JSON
function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

// Crée le serveur pepper — appelé par Auth-service GET /pepper
function createPepperServer({ serviceName, serviceKey, pepperValue }) {
  if (!serviceName || !serviceKey || !pepperValue) {
    throw new Error('serviceName, serviceKey et pepperValue sont requis');
  }

  return http.createServer((req, res) => {
    const isPepperRoute = req.method === 'GET' && req.url === '/pepper';
    const isHealthRoute = req.method === 'GET' && req.url === '/health';

    if (isHealthRoute) {
      return jsonResponse(res, 200, { status: 'ok', service: serviceName });
    }

    if (isPepperRoute) {
      const provided = req.headers['x-service-key'];
      if (!provided || !safeCompare(provided, serviceKey)) {
        const ip = req.socket.remoteAddress || '?';
        console.warn(`[${serviceName}] Tentative non autorisée depuis ${ip}`);
        return jsonResponse(res, 403, { error: 'Forbidden' });
      }

      return jsonResponse(res, 200, { pepper: pepperValue });
    }

    return jsonResponse(res, 404, { error: 'Not Found' });
  });
}

module.exports = { createPepperServer, safeCompare };
