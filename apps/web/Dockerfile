# Multi-stage Dockerfile for building the `web` app in the monorepo
# - Build stage uses node + pnpm to install workspace deps and build only the `web` package
# - Runner stage uses nginx to serve the static `dist` folder

# -------- Build stage --------
FROM node:20-alpine AS builder

# Install pnpm (via corepack) and basic tools
RUN corepack enable \
  && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace-level manifests first (helps Docker cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy web package manifest (so pnpm can resolve workspace dependencies)
COPY apps/web/package.json apps/web/package.json

# Copy package sources required for install (common packages). This is intentionally
# conservative: copy the packages folder so pnpm can resolve workspace packages.
# If your repo has other folders needed at install time, include them here.
COPY packages ./packages

# Install dependencies (will read workspace manifests and pnpm-lock.yaml)
RUN pnpm install --frozen-lockfile --reporter=silent

# Copy the rest of the repo (source code)
COPY . .

# Build only the web package using pnpm workspace filter
RUN pnpm --filter ./apps/web... build


# -------- Production stage (nginx) --------
FROM nginx:stable-alpine AS runner

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built web app from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add a small nginx config with SPA fallback (try_files)
RUN mkdir -p /etc/nginx/conf.d
COPY --chmod=0644 ./nginx/web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
