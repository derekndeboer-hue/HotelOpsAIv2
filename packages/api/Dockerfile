# Build from monorepo root context: docker build -f packages/api/Dockerfile .

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install workspace deps
RUN npm ci --workspace=packages/shared --workspace=packages/api

# Copy root tsconfig (shared/tsconfig.json extends ../../tsconfig.base.json)
COPY tsconfig.base.json ./

# Copy source
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/

# Build shared first (api runtime requires dist/), then api
RUN npm run build -w packages/shared && npm run build -w packages/api

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

RUN npm ci --workspace=packages/shared --workspace=packages/api --omit=dev

# Copy compiled output for both packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

EXPOSE 8080
USER node
CMD ["node", "packages/api/dist/index.js"]
