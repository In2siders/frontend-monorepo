# Development Dockerfile for the `web` app (no nginx)
# - Installs workspace deps and runs Vite dev server inside the container

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
COPY apps/web/package.json apps/web/package.json

# Install dependencies for dev
RUN pnpm install --reporter=silent

# Copy source files
COPY . . 

# Expose the port used in docker-compose (3000)
EXPOSE 3000

# Heathcheck URL
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
COPY package.json pnpm-workspace. yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package. json apps/web/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --reporter=silent

# Copy source code
COPY . .

# Build the app
RUN pnpm build --filter apps/web...

# Expose port from environment variable (default 3000)
EXPOSE ${PORT:-3000}

# Start the production server
CMD ["pnpm", "start", "--filter", "apps/web... "]
