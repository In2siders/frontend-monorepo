# Development Dockerfile for the `web` app (no nginx)
# - Installs workspace deps and runs Vite dev server inside the container

FROM node:20-alpine AS dev

# Enable corepack and pnpm
RUN corepack enable \
  && corepack prepare pnpm@latest --activate \
  && apk add --no-cache wget

WORKDIR /app

# Copy workspace-level manifests first to leverage Docker cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy local workspace packages so pnpm can resolve them
COPY packages ./packages

# Copy web package manifest
COPY apps/web/package.json apps/web/package.json

# Install dependencies (allow lockfile changes in dev image)
RUN pnpm install --reporter=silent

# Copy source files
COPY . .

# Expose the port used in docker-compose (3000)
EXPOSE 3000

# Healthcheck to verify dev server responds
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://localhost:3000/ || exit 1

# Start Vite dev server for the `web` package and bind to 0.0.0.0 on port 3000
CMD ["pnpm", "--filter", "web", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
