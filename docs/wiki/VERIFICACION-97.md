# Verificación de ambientes y documentación — issue #97

Fecha de comprobación: **12 de noviembre de 2026**. Solo peticiones públicas GET; no se crearon usuarios, reservas ni recursos Azure.

## Ambientes

| Ambiente | URL comprobada | HTTP | Resultado |
|----------|----------------|------|-----------|
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente DEV; versión pendiente |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=pendiente |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente PROD; versión pendiente |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=pendiente |

El estado HTTP y la configuración pública no prueban el flujo completo de login, catálogo y reservas ni que una versión específica esté desplegada. Web indica `version: pendiente` y `/health` indica `version: pendiente`; falta identificar la liberación mediante los pipelines de CD. No se abrió una sesión real ni se comprobó el portal de Application Insights.

## Documentación

- El índice enlaza los seis Markdown disponibles y la imagen de infraestructura mediante rutas locales.
- Los enlaces de código de Componentes apuntan a `develop`. El contrato de eliminación de usuarios refleja el #88 / PR #96 (409 con reservas, 204 sin reservas).
- Las instrucciones distinguen los documentos revisados en el repositorio de su futura publicación en la pestaña Wiki.

## Wiki pendiente

El remoto `https://github.com/Andy-752109/sistema-reservas-api.wiki.git` respondió `Repository not found`. El enlace web de la Wiki redirigía al repositorio durante la revisión previa del mismo día. Esto no acredita la causa: puede faltar la primera página o existir una restricción de acceso.

Se recomienda conservar estos Markdown como fuente revisada por PR y publicar también las páginas en la Wiki. El último criterio del #97 permite alternativamente confirmar estos Markdown como entrega; esa decisión sigue pendiente. No se marca como realizada la publicación ni se cierran #14/#97 por tener archivos locales.

[Inicio](Home.md) · [Estado e instrucciones](README.md)
