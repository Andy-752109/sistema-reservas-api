# Verificación de ambientes y documentación — issue #97

Comprobación inicial: **12 de noviembre de 2026**. Actualización del **13 de noviembre de 2026**: `/health`, `/espacios`, `config.js`, remoto de la Wiki y ejecución CD. Solo lecturas y peticiones públicas GET; no se crearon usuarios, reservas ni recursos Azure.

## Ambientes

| Ambiente | URL comprobada | HTTP | Resultado |
|----------|----------------|------|-----------|
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente DEV; versión pendiente |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=18f279a2f56096cf7209c51d40880547a2339d72 (13 nov) |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/espacios) | 200 | Seis espacios de ejemplo activos (13 nov) |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente PROD; versión pendiente |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=18f279a2f56096cf7209c51d40880547a2339d72 (13 nov) |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/espacios) | 200 | Seis espacios de ejemplo activos (13 nov) |

La API de ambos ambientes devuelve el SHA `18f279a2f56096cf7209c51d40880547a2339d72`, correspondiente a la primera liberación del [PR #103](https://github.com/Andy-752109/sistema-reservas-api/pull/103). Se verificó el [run CD 43512516484](https://github.com/Andy-752109/sistema-reservas-api/actions/runs/43512516484): pruebas, imagen y despliegues Dev/Prod finalizaron con éxito. El historial registra la aprobación manual de Andy para `production`.

Solo Web sigue indicando `version: pendiente` hasta el #53. Las respuestas HTTP, el SHA y el catálogo público no prueban el flujo completo de login y reservas desde la interfaz. No se usaron credenciales de administrador, no se abrió una sesión real ni se comprobó el portal de Application Insights.

## Documentación

- El índice enlaza los seis Markdown disponibles y la imagen de infraestructura mediante rutas locales.
- Los enlaces de código de Componentes apuntan a `develop`. El contrato de eliminación de usuarios refleja el #88 / PR #96 (409 con reservas, 204 sin reservas).
- Las instrucciones distinguen los documentos revisados en el repositorio de su futura publicación en la pestaña Wiki.

## Wiki accesible; publicación pendiente

Andy confirmó que el error inicial se debía a que faltaba crear la primera página de la Wiki desde GitHub, no a permisos. Ya creó la Home provisional. El 13 de noviembre se verificó `git ls-remote https://github.com/Andy-752109/sistema-reservas-api.wiki.git HEAD`, que respondió con el commit `aed177ee5ca1e2f11db5ce1ae55a27361341b3bd`.

El acuerdo confirmado con Andy es conservar los Markdown de `docs/wiki/` como fuente y publicar las seis páginas y la imagen después de fusionar el PR #102, reemplazando la Home provisional. No se publican README, PUBLICACION-* ni este archivo de evidencia. La accesibilidad del remoto no acredita que las seis páginas ya estén publicadas: sigue pendiente esa publicación y su verificación, antes de completar #14/#97.

[Inicio](Home.md) · [Estado e instrucciones](README.md)
