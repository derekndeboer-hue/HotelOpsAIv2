# Hotel Ops Platform

Cloud-native hotel operations platform for boutique hotels.

## Architecture

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** Cloud SQL (PostgreSQL) + Cloud Firestore (real-time)
- **Events:** Google Cloud Pub/Sub
- **Hosting:** Google Cloud Run (scale-to-zero)
- **CI/CD:** GitHub + Cloud Build + Cloud Deploy

## Project Structure

```
hotel-ops/
├── packages/
│   ├── api/        — Backend REST API
│   ├── web/        — React frontend SPA
│   └── shared/     — Shared TypeScript types & constants
├── infrastructure/ — Terraform, Cloud Build, migrations
└── docs/           — Architecture & deployment docs
```

## Quick Start

```bash
npm install
npm run dev:api    # Start API server
npm run dev:web    # Start frontend dev server
```

## Development

- All code is TypeScript with strict mode
- Monorepo managed with npm workspaces
- Shared types prevent API/frontend contract drift
- See `docs/onboarding.md` for full setup guide
