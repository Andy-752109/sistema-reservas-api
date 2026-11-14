# Documentación del proyecto — mantenimiento y publicación

El [índice Home](Home.md) reúne las seis páginas de documentación. Los Markdown se mantienen en el repositorio de la API para revisar cambios mediante PR; no se sincronizan automáticamente con la pestaña Wiki de GitHub.

| Fuente | Título de página al publicar |
|--------|----------------------------|
| [Home.md](Home.md) | `Home` |
| [Descripcion.md](Descripcion.md) | `Descripcion` |
| [Componentes.md](Componentes.md) | `Componentes` |
| [Stack-y-ramas.md](Stack-y-ramas.md) | `Stack-y-ramas` |
| [Infraestructura.md](Infraestructura.md) | `Infraestructura` |
| [Deployment-y-CICD.md](Deployment-y-CICD.md) | `Deployment-y-CICD` |

`README.md`, `PUBLICACION-componentes.md` y `VERIFICACION-97.md` son instrucciones/evidencia del repositorio, no páginas adicionales de la Wiki. Las imágenes `infraestructura.png`, `dashboard-plan-y-api.png` y `dashboard-tiempo-respuesta.png` acompañan a Infraestructura y deben copiarse al publicar esa página.

## Estado al 13 de noviembre de 2026

- Contenido integrado: Inicio y Descripción (#84), Componentes (#83), Stack y ramas (#85), Infraestructura (#100) y Deployment/CI/CD (#101).
- Esta actualización del #97 incorpora las URLs operativas de Web/API Dev y Prod, el repositorio de infraestructura y el comportamiento del #88 / PR #96. Home y Componentes se contrastan con `develop`.
- Los seis documentos están disponibles en el repositorio; no se afirma que estén publicados en la pestaña Wiki.
- La Wiki ya está inicializada: Andy creó la primera página `Home` y el remoto `.wiki.git` responde. El error previo se debía a que faltaba esa página, no a permisos. No se modificaron permisos ni configuración del repositorio desde este trabajo.
- El acuerdo es conservar `docs/wiki/` como fuente revisada por PR y publicar las páginas en la Wiki después de fusionar el #102. La Home existente es un placeholder; al publicar, comparar el contenido y conservar cualquier aportación nueva del equipo.
- Las comprobaciones HTTP, los resultados y sus límites están en [VERIFICACION-97.md](VERIFICACION-97.md). La API de Dev y Prod ya identifica la liberación por SHA, con CD exitoso y aprobación manual de producción. Solo la versión de Web sigue en `pendiente` hasta el #53; no se acredita la funcionalidad completa de la web.

## Publicación después de revisar el contenido

1. Revisar y fusionar el PR de documentación hacia `develop` antes de copiar su contenido a la Wiki.
2. Abrir la pestaña Wiki y revisar el contenido actual. La página inicial ya existe; no hace falta volver a crearla ni cambiar permisos.
3. Clonar `https://github.com/Andy-752109/sistema-reservas-api.wiki.git`. Comparar el contenido existente antes de actualizar y conservar aportaciones del equipo; la Home provisional puede sustituirse por la versión revisada.
4. Copiar las seis páginas y `infraestructura.png`. En la copia destinada a la Wiki, convertir enlaces entre páginas como `(Componentes.md)` a `(Componentes)` o a su URL final de Wiki, para que funcionen con el renderizador de páginas. Los enlaces de Inicio e instrucciones que apunten a README o VERIFICACION deben ir a los archivos de `docs/wiki/` en `develop`, no a páginas inexistentes. Verificar también el enlace relativo de la imagen.
5. Publicar mediante un commit y push normal a la rama predeterminada de la Wiki, con autorización; no usar force push ni sobrescribir archivos ajenos. Fusionar el repositorio de la API por sí solo no publica la Wiki.
6. Abrir las seis páginas publicadas y comprobar tablas, diagramas, imagen, índice, enlaces de navegación y ambientes. Registrar las URLs y evidencia en el PR o issue #97. Solo entonces marcar como publicadas las páginas del índice.

Los issues #14/#97 siguen pendientes de publicar y verificar las páginas en la Wiki después de fusionar el PR. No se debe inventar evidencia ni cambiar el estado a Done por preparar los archivos.

GitHub documenta que la primera página se crea en la web antes de clonar el repositorio `.wiki.git`: [agregar o editar páginas](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).

## Verificación de cambios

Para cambios solo de documentación: contrastar con el código y workflows, comprobar UTF-8 y enlaces locales, renderizar los diagramas modificados e inspeccionarlos, y ejecutar `git diff --check`. No requiere volver a ejecutar pruebas de negocio ni compilar la API.
