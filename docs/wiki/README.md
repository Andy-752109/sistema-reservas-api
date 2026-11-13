# Fuentes de la Wiki — issue #14

Estas páginas se mantienen en el repositorio de la API para revisar su contenido mediante PR antes de publicarlo en la Wiki de GitHub. Esta carpeta no se sincroniza automáticamente con la Wiki.

| Archivo para revisar | Título exacto al publicar | Ubicación de publicación |
|----------------------|---------------------------|--------------------------|
| [Home.md](Home.md) | `Home` | [Inicio de la Wiki](https://github.com/Andy-752109/sistema-reservas-api/wiki) |
| [Descripcion.md](Descripcion.md) | `Descripcion` | [Descripción](https://github.com/Andy-752109/sistema-reservas-api/wiki/Descripcion) |

`README.md` contiene instrucciones de mantenimiento: no se publica como una tercera página de la Wiki. Los enlaces entre páginas usan sus direcciones finales en GitHub; mientras no se publiquen, usa los enlaces locales de la tabla para revisar los archivos.

## Estado y fuentes

- Fuente funcional y nombres del equipo: README de la API.
- Reparto de roles, cuentas y orden de documentación: guía de arranque del equipo.
- Páginas exigidas: [issue #14](https://github.com/Andy-752109/sistema-reservas-api/issues/14).
- Secciones posteriores del índice: issues #15, #16, #18 y #19. Se enlazan sus tareas y no páginas inexistentes.
- Rama independiente creada desde `origin/develop`: `feature/14-wiki-inicio-descripcion`. No incorpora los PR de código pendientes.

El 6 de noviembre de 2026, GitHub informó `has_wiki: true` y permiso de escritura para la cuenta autenticada, pero `git ls-remote https://github.com/Andy-752109/sistema-reservas-api.wiki.git HEAD` respondió `Repository not found`. La Wiki aún no pudo leerse por Git; esto es compatible con una Wiki sin página inicial, pero no basta por sí solo para descartar otras restricciones de acceso.

No se encontraron URLs de ambientes en los README, homepage de los repositorios ni despliegues registrados en GitHub. Las cuatro direcciones públicas (API/web de Dev/Prod) quedan explícitamente pendientes de confirmar con infraestructura. No se consultaron secretos ni archivos `.env` para obtenerlas.

## Publicación después de revisar el contenido

1. Abrir la pestaña **Wiki** del repositorio de la API con la cuenta que tiene permiso de escritura. Si no existe una página inicial, crear `Home` en Markdown usando el contenido de [Home.md](Home.md) y guardarla. Si la pestaña no permite crear páginas, revisar el acceso con la persona propietaria sin cambiar permisos automáticamente.
2. Crear la página `Descripcion` en Markdown usando [Descripcion.md](Descripcion.md). Si ya existe alguna de las páginas, comparar su contenido y conservar aportaciones previas al actualizarla.
3. Abrir ambas páginas publicadas y comprobar sus enlaces de navegación, repositorios y tablero. Marcar las filas de Inicio y Descripción como publicadas en el índice cuando se confirme la publicación, actualizando también el archivo fuente.
4. Confirmar con infraestructura las URLs HTTPS de la web y la API de cada ambiente. Sustituir los pendientes en `Home.md` y en la página publicada; agregar los enlaces reales de `/api/docs` y `/health` y verificar que correspondan al ambiente indicado.
5. Guardar en el PR las URLs de las páginas publicadas y su verificación. El issue #14 permanece pendiente de completar hasta publicar ambas páginas y resolver los enlaces Dev/Prod requeridos.

La publicación en la Wiki genera commits en su repositorio separado; **fusionar este PR no publica las páginas**. Una vez creada la primera página en GitHub, el contenido también puede mantenerse clonando `https://github.com/Andy-752109/sistema-reservas-api.wiki.git` y enviando cambios a su rama predeterminada. No sobrescribas archivos ajenos a este issue ni uses force push.

Referencia oficial: [agregar o editar páginas de una Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).

## Comprobación del cambio

Este issue modifica únicamente Markdown. Revisar los encabezados y tablas, comprobar los destinos locales `Home.md`/`Descripcion.md` y ejecutar `git diff --check`. No requiere ejecutar pruebas de la API ni compilar código. La revisión local no acredita que las páginas estén publicadas ni que los ambientes estén disponibles.
