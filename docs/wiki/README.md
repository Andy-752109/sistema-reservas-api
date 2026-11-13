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

`README.md`, `PUBLICACION-componentes.md` y `VERIFICACION-97.md` son instrucciones/evidencia del repositorio, no páginas adicionales de la Wiki. La imagen `infraestructura.png` acompaña a Infraestructura y debe copiarse si se publica esa página.

## Estado al 12 de noviembre de 2026

- Contenido integrado: Inicio y Descripción (#84), Componentes (#83), Stack y ramas (#85), Infraestructura (#100) y Deployment/CI/CD (#101).
- Esta actualización del #97 incorpora las URLs operativas de Web/API Dev y Prod, el repositorio de infraestructura y el comportamiento del #88 / PR #96. Home y Componentes se contrastan con `develop`.
- Los seis documentos están disponibles en el repositorio; no se afirma que estén publicados en la pestaña Wiki.
- La Wiki sigue sin estar accesible por Git (`Repository not found`). No se modificaron permisos ni configuración del repositorio.
- Se recomienda publicar también en la Wiki para respetar la entrega original de #14/#69. El #97 permite, como alternativa, confirmar `docs/wiki/` como entrega oficial; esa confirmación sigue pendiente.
- Las comprobaciones HTTP, los resultados y sus límites están en [VERIFICACION-97.md](VERIFICACION-97.md). Las versiones desplegadas aún indican `pendiente`; no se acredita la funcionalidad completa de la web.

## Publicación después de revisar el contenido

1. Revisar y fusionar el PR de documentación hacia `develop` antes de copiar su contenido a la Wiki.
2. Con una cuenta autorizada, abrir la pestaña Wiki. Si falta la página inicial, crear `Home`. Si no permite hacerlo, coordinarlo con Andy sin cambiar permisos automáticamente.
3. Una vez creada la primera página, clonar `https://github.com/Andy-752109/sistema-reservas-api.wiki.git`. Comparar el contenido existente antes de actualizar y conservar aportaciones del equipo.
4. Copiar las seis páginas y `infraestructura.png`. En la copia destinada a la Wiki, convertir enlaces entre páginas como `(Componentes.md)` a `(Componentes)` o a su URL final de Wiki, para que funcionen con el renderizador de páginas. Los enlaces de Inicio e instrucciones que apunten a README o VERIFICACION deben ir a los archivos de `docs/wiki/` en `develop`, no a páginas inexistentes. Verificar también el enlace relativo de la imagen.
5. Publicar mediante un commit y push normal a la rama predeterminada de la Wiki, con autorización; no usar force push ni sobrescribir archivos ajenos. Fusionar el repositorio de la API por sí solo no publica la Wiki.
6. Abrir las seis páginas publicadas y comprobar tablas, diagramas, imagen, índice, enlaces de navegación y ambientes. Registrar las URLs y evidencia en el PR o issue #97. Solo entonces marcar como publicadas las páginas del índice.

Los issues #14/#97 siguen pendientes de su criterio de publicación o de una confirmación explícita de entrega mediante los Markdown. No se debe inventar evidencia ni cambiar el estado a Done por preparar los archivos.

GitHub documenta que la primera página se crea en la web antes de clonar el repositorio `.wiki.git`: [agregar o editar páginas](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).

## Verificación de cambios

Para cambios solo de documentación: contrastar con el código y workflows, comprobar UTF-8 y enlaces locales, renderizar los diagramas modificados e inspeccionarlos, y ejecutar `git diff --check`. No requiere volver a ejecutar pruebas de negocio ni compilar la API.
