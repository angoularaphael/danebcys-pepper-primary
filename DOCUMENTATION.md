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
