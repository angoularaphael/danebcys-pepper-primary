// Tests d'intégration pepper-primary (GET /pepper, /health, safeCompare)

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createPepperServer, safeCompare } = require('../lib/pepperServer');

const TEST_KEY = 'test-key-primary-' + Date.now();
const TEST_PEPPER = 'pepper-value-primary-' + Date.now();
const SERVICE_NAME = 'pepper-primary';

let server;
let baseUrl;

test.before(async () => {
  server = createPepperServer({
    serviceName: SERVICE_NAME,
    serviceKey: TEST_KEY,
    pepperValue: TEST_PEPPER
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function request(path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${path}`,
      { method, headers },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(body); } catch (_) { /* ignore */ }
          resolve({ status: res.statusCode, body, json });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('GET /pepper avec la bonne clé renvoie 200 et la valeur du pepper', async () => {
  const res = await request('/pepper', { 'X-Service-Key': TEST_KEY });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, { pepper: TEST_PEPPER });
});

test('GET /pepper avec une mauvaise clé renvoie 403', async () => {
  const res = await request('/pepper', { 'X-Service-Key': 'wrong-key' });
  assert.equal(res.status, 403);
  assert.equal(res.json.error, 'Forbidden');
});

test('GET /pepper sans header X-Service-Key renvoie 403', async () => {
  const res = await request('/pepper');
  assert.equal(res.status, 403);
});

test('GET /pepper avec une clé vide renvoie 403', async () => {
  const res = await request('/pepper', { 'X-Service-Key': '' });
  assert.equal(res.status, 403);
});

test('POST /pepper renvoie 404 (seul GET est exposé)', async () => {
  const res = await request('/pepper', { 'X-Service-Key': TEST_KEY }, 'POST');
  assert.equal(res.status, 404);
});

test('GET /health renvoie 200 sans authentification', async () => {
  const res = await request('/health');
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'ok');
  assert.equal(res.json.service, SERVICE_NAME);
});

test('GET /unknown renvoie 404', async () => {
  const res = await request('/whatever');
  assert.equal(res.status, 404);
});

test('safeCompare retourne true pour deux chaînes égales', () => {
  assert.equal(safeCompare('abc', 'abc'), true);
  assert.equal(safeCompare(TEST_KEY, TEST_KEY), true);
});

test('safeCompare retourne false pour deux chaînes différentes', () => {
  assert.equal(safeCompare('abc', 'abd'), false);
  assert.equal(safeCompare('abc', 'abcd'), false);
  assert.equal(safeCompare('', 'a'), false);
});

test("createPepperServer rejette une configuration incomplète", () => {
  assert.throws(() => createPepperServer({}), /requis/);
  assert.throws(
    () => createPepperServer({ serviceName: 'x', serviceKey: 'y' }),
    /requis/
  );
});
