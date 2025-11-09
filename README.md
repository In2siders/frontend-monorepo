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

# 💻 Proyecto Intermodular (Monorepo)

Repositorio privado para el **desarrollo de nuestro proyecto**. A continuación, se presentan guías y normas a seguir.

---

## 📦 ¿Qué hay dentro?

Este **Turborepo** incluye lo siguiente:

### Aplicaciones y Paquetes

* `web`: Aplicación **Vanilla JS** con **Vite**.
* `desktop`: Aplicación **Electron** con **Vite**.
* `@repo/styling`: Archivos **CSS** para los estilos, comunes en todas las aplicaciones.
* `@repo/common`: Código **común** compartido.
* `@repo/connection`: No estoy seguro de si lo usaremos. Pero es para colocar todo el código de las **conexiones** (o llamadas a la API, no sé).

---

## 🚀 Despliegue Rápido (web)

Publicamos una imagen de **Docker** para la aplicación `web` en el **GitHub Container Registry** en cada *push* a la rama `master`.

Para ejecutar la última imagen `web` publicada localmente:

```bash
docker-compose -f docker-compose.web.yml up -d
