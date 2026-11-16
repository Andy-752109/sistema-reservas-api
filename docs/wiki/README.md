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

## Estado al 16 de noviembre de 2026

- Contenido integrado: Inicio y Descripción (#84), Componentes (#83), Stack y ramas (#85), Infraestructura (#100) y Deployment/CI/CD (#101).
- Esta actualización del #97 incorpora las URLs operativas de Web/API Dev y Prod, el repositorio de infraestructura y el comportamiento del #88 / PR #96. Home y Componentes se contrastan con `develop`.
- Las seis páginas se publicaron después del PR #102 en la [Wiki de GitHub](https://github.com/Andy-752109/sistema-reservas-api/wiki), mediante el commit de Wiki `73581ef`; sus URLs se comprobaron nuevamente el 16 de noviembre.
- La Wiki ya está inicializada: Andy creó la primera página `Home` y el remoto `.wiki.git` responde. El error previo se debía a que faltaba esa página, no a permisos. No se modificaron permisos ni configuración del repositorio desde este trabajo.
- El acuerdo es conservar `docs/wiki/` como fuente revisada por PR y sincronizar la Wiki después de cada merge de documentación. Home ya contiene el índice, no un placeholder. La actualización de métricas de Andy (commit de Wiki `1454387`) debe conservarse al sincronizar.
- API y Web ya se liberaron por CD a Dev y Prod, con aprobación manual de producción. Web muestra `version: 7d33986` en ambos ambientes y sus bundles tienen hashes idénticos. Andy confirmó el flujo desde la interfaz de Prod y sus trazas de negocio en Application Insights; el origen de esa evidencia y las verificaciones directas están en [VERIFICACION-97.md](VERIFICACION-97.md).
- Esta pasada final corrige las referencias antiguas al CD web pendiente. Falta fusionarla y sincronizar Home en la Wiki antes de registrar el cierre de #14/#97.

## Publicación después de revisar el contenido

1. Revisar y fusionar el PR de documentación hacia `develop` antes de copiar su contenido a la Wiki.
2. Abrir la pestaña Wiki y revisar el contenido actual; sus seis páginas ya existen.
3. Clonar `https://github.com/Andy-752109/sistema-reservas-api.wiki.git` o actualizar el clon existente con un avance normal de su rama predeterminada. Comparar antes de modificar y conservar las aportaciones del equipo.
4. Sincronizar únicamente las páginas modificadas y sus imágenes asociadas; no sobrescribir otras páginas. En la copia destinada a la Wiki, convertir enlaces entre páginas como `(Componentes.md)` a `(Componentes)` o a su URL final de Wiki, para que funcionen con el renderizador de páginas. Los enlaces de Inicio e instrucciones que apunten a README o VERIFICACION deben ir a los archivos de `docs/wiki/` en `develop`, no a páginas inexistentes. Verificar también los enlaces relativos de las imágenes.
5. Publicar mediante un commit y push normal a la rama predeterminada de la Wiki, con autorización; no usar force push ni sobrescribir archivos ajenos. Fusionar el repositorio de la API por sí solo no publica la Wiki.
6. Abrir las seis páginas publicadas y comprobar tablas, diagramas, imagen, índice, enlaces de navegación y ambientes. Registrar las URLs y evidencia en el PR o issue #97. Solo entonces marcar como publicadas las páginas del índice.

El cierre de #14/#97 requiere fusionar esta actualización final, sincronizar Home y registrar el PR, el commit de Wiki y la verificación de los enlaces y contenidos. La publicación inicial ya está realizada; preparar los cambios finales localmente no acredita su sincronización.

GitHub documenta que la primera página se crea en la web antes de clonar el repositorio `.wiki.git`: [agregar o editar páginas](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).

## Verificación de cambios

Para cambios solo de documentación: contrastar con el código y workflows, comprobar UTF-8 y enlaces locales, renderizar los diagramas modificados e inspeccionarlos, y ejecutar `git diff --check`. No requiere volver a ejecutar pruebas de negocio ni compilar la API.
