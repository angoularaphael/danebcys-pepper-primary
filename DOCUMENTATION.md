# pepper-primary

## Rôle
Expose le pepper primaire utilisé par `Auth-service` pour le calcul sécurisé des hashes de mot de passe.

## Mise à jour 2026-03
- Service strictement interne (aucun appel frontend).
- Doit rester accessible uniquement dans le réseau backend Docker/local.

## Port et santé
- Port par défaut: `3098`
- Healthcheck: `GET /health`

## Variables d'environnement (canoniques)
- `PORT`
- `SERVICE_KEY`
- `PEPPER_VALUE`

## Routes
- `GET /pepper` (protégée par header `X-Service-Key`)
- `GET /health`

## Sécurité
- Vérification `X-Service-Key` via comparaison timing-safe (`SHA-256` + `timingSafeEqual`)
- `PEPPER_VALUE` doit rester uniquement en environnement (jamais hardcodé)

## Dépendances
- Aucune dépendance DB
- Utilisé par `Auth-service`

## Démarrage
- Local: `npm start`
- Docker: via `docker compose --env-file .env.docker up --build`

## Secrets & configuration
- **Fichier source** : `pepper-primary/.env` (non versionné par Git).
- **Copie locale de référence** : `Secrets-Danebcys/pepper-primary/.env`, synchronisée depuis la racine du monorepo avec `.\scripts\sync-secrets-danebcys.ps1` (PowerShell).
- Ne jamais committer les valeurs sensibles.

# Pepper Primary — Documentation technique

> Microservice de fourniture du **pepper primaire** pour le hashage des mots de passe dans **DANEBCYS**.  
> Le pepper n'est jamais stocké dans Auth-service : il est récupéré à la volée lors du signup et du login.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Sécurité](#3-sécurité)
4. [Endpoints](#4-endpoints)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [Installation et lancement](#6-installation-et-lancement)

---

## 1. Vue d'ensemble

| Propriété | Valeur |
|-----------|--------|
| Port | 3098 |
| Technologie | HTTP natif (module `http`), pas d'Express |
| Base de données | Aucune |
| Dépendances | dotenv |

Le **pepper-primary** fournit le **premier pepper** utilisé par Auth-service pour combiner avec pepper-service via HMAC-SHA256 :

```
combinedPepper = HMAC-SHA256(pepper_primary, pepper_service)
```

---

## 2. Architecture du projet

```
pepper-primary/
├── server.js      # Point d'entrée unique (http.createServer)
├── .env           # PORT, SERVICE_KEY, PEPPER_VALUE
├── .gitignore
├── package.json   # dotenv uniquement
└── DOCUMENTATION.md
```

---

## 3. Sécurité

- **X-Service-Key** : Requis pour l'endpoint `/pepper`. Seuls les services connaissant la clé (Auth-service) peuvent récupérer le pepper.
- **Comparaison sécurisée** : `safeCompare` utilise SHA-256 + `crypto.timingSafeEqual` pour éviter les attaques par timing.
- **PEPPER_VALUE** : Secret stocké uniquement dans `.env`, jamais exposé dans le code.
- **Réseau interne** : En production, ce service ne doit pas être exposé publiquement.

---

## 4. Endpoints

### `GET /pepper`

Retourne le pepper. **Protection** : header `X-Service-Key` requis.

**Réponse 200** :
```json
{ "pepper": "..." }
```

**Réponse 403** : Clé manquante ou invalide.

### `GET /health`

Health check. Aucune authentification requise.

**Réponse 200** :
```json
{ "status": "ok", "service": "pepper-primary" }
```

---

## 5. Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| PORT | Port du serveur | 3098 |
| SERVICE_KEY | Clé partagée avec Auth-service (= PEPPER_PRIMARY_KEY) | — |
| PEPPER_VALUE | Secret pepper (chaîne aléatoire longue) | — |

---

## 6. Installation et lancement

```bash
cd pepper-primary
npm install
cp .env.example .env
# Modifier .env : SERVICE_KEY, PEPPER_VALUE
npm start
```

**Ordre de démarrage** : pepper-primary doit être démarré **avant** Auth-service. Il est le premier des deux pepper services à lancer.
