# Developer Onboarding

Welcome to the Hotel Ops platform. This guide will get you set up and ready to contribute.

## 1. Access

Request access to the following:

- **GitHub** - Ask a team lead to add you to the `hotel-ops` repository
- **Google Cloud** - Request project viewer/editor access via your team lead
- **Figma** - Request viewer access for design specs
- **Linear/Jira** - Request project board access for task tracking

## 2. Development Environment

### Option A: GitHub Codespaces (recommended)

1. Open the repository on GitHub
2. Click **Code > Codespaces > New codespace**
3. The devcontainer will automatically install all dependencies and configure the environment
4. Wait for the postCreate command to finish (installs deps, sets up local DB)

### Option B: Local Setup

Prerequisites:
- Node.js 20+
- Docker and Docker Compose
- Google Cloud SDK

```bash
# Clone the repository
git clone git@github.com:YOUR_ORG/hotel-ops.git
cd hotel-ops

# Install dependencies
npm ci

# Start local services (Postgres, Redis, Pub/Sub emulator)
docker compose up -d

# Run database migrations
npm run db:migrate

# Seed local database
npm run db:seed
```

## 3. Environment Variables

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description | Local Default |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/hotel_ops` |
| `JWT_SECRET` | Access token signing key | `dev-jwt-secret` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | `dev-jwt-refresh-secret` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | API server port | `8080` |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator address | `localhost:8081` |
| `PUBSUB_EMULATOR_HOST` | Pub/Sub emulator address | `localhost:8085` |
| `GCS_EMULATOR_HOST` | Storage emulator address | `localhost:9023` |

## 4. Local Development

```bash
# Start all packages in dev mode (API + Web)
npm run dev

# Start API only
npm run dev:api

# Start web only
npm run dev:web

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Type check
npm run typecheck
```

The API runs on `http://localhost:8080` and the web app on `http://localhost:5173`.

Default admin credentials (local only):
- Email: `admin@hotel-ops.local`
- Password: `admin123`

## 5. Branch Naming

Follow this convention:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/SHORT-DESCRIPTION` | `feature/room-board-filters` |
| Bug fix | `fix/SHORT-DESCRIPTION` | `fix/schedule-overlap-check` |
| Chore | `chore/SHORT-DESCRIPTION` | `chore/upgrade-prisma` |
| Docs | `docs/SHORT-DESCRIPTION` | `docs/api-auth-section` |

Keep branch names lowercase, use hyphens, and keep them concise.

## 6. PR Process

1. Create a feature branch from `develop`
2. Make your changes with clear, atomic commits
3. Ensure all checks pass locally: `npm run lint && npm run typecheck && npm test`
4. Push your branch and open a PR against `develop`
5. Fill out the PR template completely
6. Request review from the appropriate code owners (see `.github/CODEOWNERS`)
7. Address all review feedback
8. Once approved, squash-merge into `develop`

### PR Requirements

- All CI checks must pass (lint, typecheck, test, build)
- At least 1 approval from a code owner
- No unresolved conversations
- Branch must be up to date with `develop`

## 7. Project Structure

```
hotel-ops/
  packages/
    api/          # Express API (Cloud Run)
    web/          # React frontend (Cloud Storage)
    shared/       # Shared types and utilities
  infrastructure/ # Terraform, Cloud Build, Firestore rules
  docs/           # Documentation
  .github/        # PR templates, CODEOWNERS, workflows
```

## 8. Useful Commands

```bash
# Generate a new Prisma migration
npm run db:migrate:create -- --name your_migration_name

# Open Prisma Studio (database GUI)
npm run db:studio

# Build all packages
npm run build

# Build for production
npm run build:prod
```

## Questions?

Reach out in the `#hotel-ops-dev` channel or tag your team lead.
