# Pepper Primary — Documentation technique

> Microservice interne fournissant le **premier** pepper cryptographique.  
> Même architecture que pepper-service. Serveur HTTP natif Node.js.

---

## Rôle

Ce service fournit le **pepper primaire** au Auth Service. Il fonctionne exactement comme le `pepper-service` (secondaire) mais sur un port différent et avec sa propre valeur de pepper.

Les deux peppers (primaire + secondaire) sont combinés par le Auth Service via `HMAC-SHA256(primary, secondary)` pour former le pepper final.

Le Auth Service **ne stocke aucun pepper** — les deux viennent de microservices externes.

---

## Architecture

```
pepper-primary/
├── server.js         # Serveur HTTP natif (http.createServer)
├── package.json      # Unique dépendance : dotenv
├── .env.example
├── .env
└── DOCUMENTATION.md
```

---

## Endpoint

| Méthode | Route    | Auth            | Description          |
|---------|----------|-----------------|----------------------|
| GET     | /pepper  | X-Service-Key   | Retourne le pepper   |
| GET     | /health  | Aucune          | Health check         |

---

## Variables d'environnement

| Variable      | Description                                | Défaut |
|---------------|--------------------------------------------|--------|
| PORT          | Port d'écoute                              | 3098   |
| SERVICE_KEY   | Clé partagée (= `PEPPER_PRIMARY_KEY`)      | *requis* |
| PEPPER_VALUE  | Valeur du pepper primaire                  | *requis* |

### Correspondance avec le Auth Service

| pepper-primary (.env) | Auth Service (.env)       |
|-----------------------|---------------------------|
| `SERVICE_KEY`         | `PEPPER_PRIMARY_KEY`      |
| —                     | `PEPPER_PRIMARY_URL`      |

---

## Installation

```bash
cd pepper-primary
npm install
cp .env.example .env
npm start
# → [Pepper Primary] Port 3098
```

---

## Sécurité

- Header `X-Service-Key` obligatoire, comparé via SHA-256 + `timingSafeEqual`
- Serveur HTTP natif, zéro framework, surface d'attaque minimale
- En production : réseau interne uniquement, jamais exposé publiquement
