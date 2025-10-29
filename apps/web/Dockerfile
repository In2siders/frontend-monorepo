# Multi-stage Dockerfile for building the `web` app in the monorepo
# - Build stage uses node + pnpm to install workspace deps and build only the `web` package
# - Runner stage uses nginx to serve the static `dist` folder

# -------- Build stage --------
FROM node:20-alpine

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Optional: git may be needed by some packages
RUN apk add --no-cache git

WORKDIR /workspace

# Copy workspace-level manifests first to leverage Docker layer cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Also copy the app's package.json to help pnpm cache (optional but useful)
COPY apps/web/package.json ./apps/web/package.json

# Install workspace dependencies
RUN pnpm install --frozen-lockfile --reporter=silent

# Copy the rest of the repository
COPY . .

# Switch to the web app folder for runtime
WORKDIR /workspace/apps/web

# Ensure Vite listens on all interfaces and on port 3000
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start the dev server (dev image). Use the pnpm workspace filter to run the web dev script.
CMD ["pnpm", "--filter", "./apps/web...", "dev"]