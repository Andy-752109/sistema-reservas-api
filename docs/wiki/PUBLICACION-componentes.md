# Publicación de Componentes — issue #15

El contenido para revisar está en [Componentes.md](Componentes.md). Este archivo de instrucciones no se publica como página de la Wiki.

## Estado

La rama `feature/15-wiki-componentes` se creó desde `origin/develop`, en una carpeta de trabajo separada para no modificar los documentos pendientes del issue #14. Documenta el código de los PR hasta el #82 mediante enlaces al commit `ead81f2e1aca9795367357c2b0e9208d4eb57c98`; no incorpora esos cambios de código ni afirma que estén integrados.

No se requieren URLs de Azure para preparar o publicar esta página. Sí se requiere acceso a una Wiki inicializada. En la revisión del issue #14, la Wiki figuraba habilitada, pero su remoto Git devolvía `Repository not found`; falta confirmar la creación de su primera página o resolver el acceso. No se modificaron permisos.

## Pasos de publicación

1. Revisar y aprobar el contenido del PR del issue #15.
2. Abrir la pestaña Wiki del repositorio de la API. Si todavía no existe una página inicial, coordinar su creación con el contenido `Home` del issue #14, conservando ese trabajo separado.
3. Crear o actualizar una página Markdown con el título exacto `Componentes`, copiando [Componentes.md](Componentes.md). Si ya existe contenido, compararlo antes de actualizar y conservar aportaciones ajenas.
4. Abrir `https://github.com/Andy-752109/sistema-reservas-api/wiki/Componentes` y comprobar el renderizado del bloque `classDiagram`, enums, multiplicidades y tablas.
5. En el índice de Home, enlazar esta página y cambiar el estado del issue #15 a publicado. Reflejar esa modificación en el archivo fuente de Home del issue #14 cuando esté disponible, sin sobrescribir el resto del índice.
6. Registrar el enlace publicado y la verificación visual en el PR. La aprobación/fusión de archivos en el repositorio principal no publica por sí sola la Wiki.

Hasta publicar y comprobar la página en GitHub, queda pendiente esa evidencia. No hace falta esperar los despliegues Dev/Prod; sus URLs pertenecen al índice del issue #14.

## Verificación del contenido

- Comparar atributos, enums y relaciones con `prisma/schema.prisma` del commit citado.
- Contrastar métodos y rutas con los servicios, controladores y DTO de usuarios, autenticación, espacios y reservas de ese commit.
- Comprobar sintaxis y renderizado Mermaid, enlaces locales y `git diff --check`.
- Este cambio solo agrega documentación: no requiere ejecutar pruebas de negocio ni compilar la API.

Verificación local del 6 de noviembre de 2026: el diagrama se renderizó con Mermaid CLI 11.12.0 y se inspeccionó como imagen; se ven las tres clases, los dos enums y las multiplicidades. Se contrastaron las 18 rutas declaradas en los controladores con la tabla (más tres rutas de Swagger documentadas por separado), y se comprobaron enlaces locales, sintaxis de URLs, UTF-8 y espacios. Esto no acredita la publicación de la página ni la disponibilidad de URLs remotas.

Referencias: [diagramas de clases Mermaid](https://mermaid.js.org/syntax/classDiagram.html) y [edición de una Wiki de GitHub](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages).
