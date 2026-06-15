// Microservice pepper-primary — fournit le pepper primaire pour le hashage des mots de passe
// Auth-service appelle GET /pepper avec X-Service-Key. Aucun appel sortant, pepper en mémoire.

require('dotenv').config();
const { createPepperServer } = require('./lib/pepperServer');

// Port d'écoute (défaut 3098)
const PORT = parseInt(process.env.PORT, 10) || 3098;
// Clé inter-service attendue dans X-Service-Key
const SERVICE_KEY = process.env.SERVICE_KEY;
// Valeur du pepper primaire
const PEPPER_VALUE = process.env.PEPPER_VALUE;

if (!SERVICE_KEY || !PEPPER_VALUE) {
  console.error('[pepper-primary] SERVICE_KEY et PEPPER_VALUE sont requis (.env / environnement)');
  process.exit(1);
}

const server = createPepperServer({
  serviceName: 'pepper-primary',
  serviceKey: SERVICE_KEY,
  pepperValue: PEPPER_VALUE
});

server.listen(PORT, () => {
  console.log(`[pepper-primary] Écoute sur le port ${PORT}`);
});
