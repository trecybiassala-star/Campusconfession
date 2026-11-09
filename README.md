# CampusConfessions

CampusConfessions est une application web de confessions anonymes pour campus, conçue pour permettre aux étudiants de partager librement sans pression, avec modération et gestion de contenu.

## Slogan

Dis-le sans pression

## Fonctionnalités principales

- Publication anonyme de confessions
- Sélection de campus
- Filtres par recherche, catégorie et tri
- Réactions, commentaires et signalements
- Tableau de bord de modération
- Masquage, revue et résolution des signalements
- API backend avec Prisma + PostgreSQL
- Interface React + Vite

## Stack technique

- Frontend : React + Vite + TypeScript
- Backend : NestJS + TypeScript
- Base de données : PostgreSQL + Prisma
- Tests : Jest + Supertest

## Structure du projet

```text
Campusconfession/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── README.md
├── LICENSE
├── index.html
└── package.json
```

## Lancer le projet localement

### 1) Installer les dépendances

```bash
cd /workspaces/Campusconfession/backend && npm install
cd /workspaces/Campusconfession/frontend && npm install
```

### 2) Démarrer PostgreSQL

Le projet attend une base PostgreSQL configurée via la variable DATABASE_URL.

### 3) Démarrer le backend

```bash
cd /workspaces/Campusconfession/backend
npm run start:dev
```

Le backend tourne généralement sur :

```text
http://localhost:3001
```

### 4) Démarrer le frontend

```bash
cd /workspaces/Campusconfession/frontend
npm run dev -- --host 0.0.0.0
```

Le frontend est alors accessible sur :

```text
http://localhost:5174
```

### 5) Vérifier le projet

```bash
cd /workspaces/Campusconfession/backend && npm test -- --runInBand --config ./test/jest-e2e.json
cd /workspaces/Campusconfession/frontend && npm run build
```

## État actuel

La version actuelle inclut :
- confessions
- campus
- réactions
- commentaires
- signalements
- modération
- filtrage et tableau de bord

## Licence

Ce projet est distribué sous la licence indiquée dans [LICENSE](LICENSE).
