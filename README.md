# Proyecto Intermodular (Monorepo)

Repositorio privado para el desarollo de nuestro proyecto. Debajo tienes guias y normas a seguir.

## What's inside?

This Turborepo includes the following:

### Apps and Packages

- `web`: a [Next.js](https://nextjs.org/) app
- `server`: an [Express](https://expressjs.com/) server
- `desktop`: a React component library
- `@repo/styling`: CSS files for the styles, common in all the apps
- `@repo/common`: Common code
- `@repo/connection`: I don't know if we will use it. But is to put all the code for connections (or api calls, idk)
- `@repo/eslint-config`: ESLint presets
- `@repo/typescript-config`: tsconfig.json's used throughout the monorepo
- `@repo/jest-presets`: Jest configurations

### Docker

This repo is configured to be built with Docker, and Docker compose. To build all apps in this repo:

```
# Install dependencies
pnpm install

# Create a network, which allows containers to communicate
# with each other, by using their container name as a hostname
docker network create app_network

# Build prod using new BuildKit engine
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build

# Start prod in detached mode
docker-compose -f docker-compose.yml up -d
```

Open http://localhost:3000.

To shutdown all running containers:

```
# Stop running containers started by docker-compse
 docker-compose -f docker-compose.yml down
```

## Commit Instructions

idk, i will complete this in a future