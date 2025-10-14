# Proyecto Intermodular (Monorepo)

Repositorio privado para el desarollo de nuestro proyecto. Debajo tienes guias y normas a seguir.

## What's inside?

This Turborepo includes the following:

### Apps and Packages

- `web`: Vanilla JS app w. Vite
- `desktop`: Electron App w. Vite
- `@repo/styling`: CSS files for the styles, common in all the apps
- `@repo/common`: Common code
- `@repo/connection`: I don't know if we will use it. But is to put all the code for connections (or api calls, idk)

## Quick deploy (web)

We publish a Docker image for the `web` app to GitHub Container Registry on pushes to `master`.

To run the latest published web image locally:

```bash
docker-compose -f docker-compose.web.yml up -d
```

CI notes: the workflow `.github/workflows/publish-web-image.yml` builds `apps/web/Dockerfile` and pushes the image to `ghcr.io/<ORG>/frontend-web:latest`.