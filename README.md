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

## Ejecutar

```bash
pnpm install

pnpm run dev
```

## Reglas para colaborar

Diferenciamos dos ramas:

- `master`
- `dev`

`master` es nuestra version en producción (una version sin errores a poder ser). Y la versión `dev` es nuestrsa version en espera de perfección.

Si quieres arreglar algun problema de la rama `dev` debes clonar la rama y hacer los cambios ahí, o si quieres añadir algun cambio, puedes clonar la rama `master` y hacer los cambios ahí.

Para subir los cambios, debes crear una nueva rama, la rama se debe llamar `tuUsername-dev-elCambioResumidamente`. Por ejemplo,
yo hago que el servidor espere en otro puerto, pues quedaria: `ezequiel-dev-server-puerto-nuevo`

Luego para añadir los cambios, hago una Pull Request de mi rama, a la rama dev y esperamos a que el equipo apruebe la solicitud (3 solicitudes requeridas, sin contar al autor.)