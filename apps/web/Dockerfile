# Development Dockerfile for the `web` app
# Build context should be the repository root

FROM node:20-alpine AS dev

# Enable corepack and pnpm
RUN corepack enable \
  && corepack prepare pnpm@latest --activate \
  && apk add --no-cache wget

WORKDIR /app

# Copy workspace-level manifests first to leverage Docker cache
COPY package.json pnpm-workspace.yaml pnpm-lock. yaml ./

# Copy local workspace packages so pnpm can resolve them
COPY packages ./packages

# Copy web package manifest
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (allow lockfile changes in dev image)
RUN pnpm install --reporter=silent

# Copy source files
COPY apps/web ./apps/web

# Expose the port used in docker-compose (3000)
EXPOSE 3000

# Heathcheck
ENV HEALTHCHECK_URL=http://localhost:3000/

# Healthcheck to verify dev server responds
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 $HEALTHCHECK_URL || exit 1

# Production build stage
FROM node:20-alpine AS prod

# Enable corepack and pnpm
RUN corepack enable \
  && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json

# Install ALL dependencies (we need turbo and vite which are devDependencies)
RUN pnpm install --frozen-lockfile --reporter=silent

# Copy app source code
COPY apps/web ./apps/web

# Build the app directly (not through turbo at root level)
RUN cd apps/web && pnpm build

# Expose port from environment variable (default 4173, Vite preview default)
ENV PORT=4173
EXPOSE ${PORT}

# Start Vite preview server on the PORT env variable
CMD ["sh", "-c", "cd apps/web && pnpm preview --host 0.0.0.0 --port ${PORT}"]
