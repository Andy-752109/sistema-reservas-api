# Publicación de Componentes

[Componentes.md](Componentes.md) describe la implementación integrada en `develop`, actualizada por el #97. Incluye las reglas de traslape, concurrencia y permisos, los endpoints y la conservación del historial al impedir eliminar usuarios con reservas (#88 / PR #96).

Las instrucciones de publicación de todas las páginas están centralizadas en [README](README.md). No publicar este archivo como una página de la Wiki.

## Comprobación antes de publicar

- Contrastar atributos y relaciones con `prisma/schema.prisma`; Usuario y Espacio usan `onDelete: Restrict`.
- Contrastar métodos, permisos y respuestas con servicios, controladores, DTO y Swagger en `develop`.
- Revisar el `classDiagram`, sus dos enums y las multiplicidades. El bloque del diagrama no cambia en el #97; ya fue renderizado e inspeccionado visualmente en el #83.
- Comprobar los enlaces de código y de navegación. En la Wiki, adaptar los enlaces de archivos `.md` a las páginas publicadas como indica el README.
- Guardar la URL de la página publicada y su comprobación visual. Tener el Markdown en el repositorio no acredita publicación en la pestaña Wiki.

Estado de ambientes y límites de comprobación: [VERIFICACION-97.md](VERIFICACION-97.md).
