# Verificación de ambientes y documentación — issue #97

Comprobación inicial: **12 de noviembre de 2026**. Actualización del **13 de noviembre de 2026**: `/health`, `/espacios`, `config.js`, remoto de la Wiki y ejecución CD de la API. Actualización del **16 de noviembre de 2026**: liberación del web, configuración de ambos ambientes, hashes de bundles y páginas publicadas. Las comprobaciones directas de esta actualización fueron de lectura; no se crearon usuarios, reservas ni recursos Azure.

## Ambientes

| Ambiente | URL comprobada | HTTP | Resultado |
|----------|----------------|------|-----------|
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-web-dev-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente DEV; version=7d33986 (16 nov) |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=18f279a2f56096cf7209c51d40880547a2339d72 (13 nov) |
| DEV | [Abrir](https://reservas-api-dev-rw39me.azurewebsites.net/espacios) | 200 | Seis espacios de ejemplo activos (13 nov) |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-web-prod-rw39me.azurewebsites.net/config.js) | 200 | API del mismo ambiente; ambiente PROD; version=7d33986 (16 nov) |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) | 200 | Disponible por HTTPS |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs-json) | 200 | Documento OpenAPI 3.0.0 |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/health) | 200 | status=ok; database=up; version=18f279a2f56096cf7209c51d40880547a2339d72 (13 nov) |
| PROD | [Abrir](https://reservas-api-prod-rw39me.azurewebsites.net/espacios) | 200 | Seis espacios de ejemplo activos (13 nov) |

La API de ambos ambientes devuelve el SHA `18f279a2f56096cf7209c51d40880547a2339d72`, correspondiente a la primera liberación del [PR #103](https://github.com/Andy-752109/sistema-reservas-api/pull/103). Se verificó el [run CD 43512516484](https://github.com/Andy-752109/sistema-reservas-api/actions/runs/43512516484): pruebas, imagen y despliegues Dev/Prod finalizaron con éxito. El historial registra la aprobación manual de Andy para `production`.

Web se liberó por CD el 16 nov (`version: 7d33986`, [web #9](https://github.com/Andy-752109/sistema-reservas-web/pull/9)). Se verificó el [run 43815081376](https://github.com/Andy-752109/sistema-reservas-web/actions/runs/43815081376), correspondiente al SHA `7d3398636d76e9f89396cfe8d2999fb83b5b52d3`: pruebas, cobertura, imagen y despliegues Dev/Prod finalizaron con éxito. El historial registra la aprobación manual de Andy para `production`.

### Bundles de Dev y Prod

Se descargaron por HTTPS los assets referenciados por el HTML de ambos ambientes y se compararon sus bytes mediante SHA-256 el 16 de noviembre. Cada asset devolvió HTTP 200 y el mismo hash en Dev y Prod:

| Asset | SHA-256 en ambos ambientes |
|-------|--------------------------|
| `index-CFFuuYyX.js` | `f522e56b34c82bc45ec33703c66b692aad4d3a2c6766a979795953e033c1a6c4` |
| `index-DiLFDFk9.css` | `cc505c4e319ef8e892adade92bbfdda7315f7cce9f18fbcb2aeb0d057af6b950` |

### Prueba funcional y APM del equipo

Andy confirmó el 16 de noviembre que se probó en Prod, desde la interfaz, inicio de sesión → catálogo → reservar → Mis reservas → cancelar, y que Application Insights registró `reserva.creada`, `reserva.cancelada` y `reserva.traslape`. Este resultado se documenta como validación reportada por Andy; no se atribuye a las comprobaciones HTTP ni a una inspección visual automatizada de este cambio. Las capturas del CD, footer, dashboard y consulta de APM forman parte del plan B del checklist de la demo.

Las verificaciones directas del CD, `config.js`, hashes y publicación respaldan la liberación. La prueba funcional y la comprobación del portal de Application Insights proceden del reporte del equipo, no de las pruebas locales anteriores.

## Documentación

- El índice enlaza los seis Markdown disponibles y la imagen de infraestructura mediante rutas locales.
- Los enlaces de código de Componentes apuntan a `develop`. El contrato de eliminación de usuarios refleja el #88 / PR #96 (409 con reservas, 204 sin reservas).
- Las instrucciones distinguen los documentos fuente revisados en el repositorio de su publicación y sincronización en la pestaña Wiki.

## Wiki publicada y actualización final sincronizada

Andy confirmó que el error inicial se debía a que faltaba crear la primera página de la Wiki desde GitHub, no a permisos. Ya creó la Home provisional. El 13 de noviembre se verificó `git ls-remote https://github.com/Andy-752109/sistema-reservas-api.wiki.git HEAD`, que respondió con el commit `aed177ee5ca1e2f11db5ce1ae55a27361341b3bd`.

Después de fusionar el PR #102, se publicaron las seis páginas y la imagen de infraestructura, reemplazando la Home provisional, mediante el commit de Wiki `73581ef`. El 16 de noviembre se volvieron a comprobar por HTTPS [Home](https://github.com/Andy-752109/sistema-reservas-api/wiki), [Descripcion](https://github.com/Andy-752109/sistema-reservas-api/wiki/Descripcion), [Componentes](https://github.com/Andy-752109/sistema-reservas-api/wiki/Componentes), [Stack-y-ramas](https://github.com/Andy-752109/sistema-reservas-api/wiki/Stack-y-ramas), [Infraestructura](https://github.com/Andy-752109/sistema-reservas-api/wiki/Infraestructura) y [Deployment-y-CICD](https://github.com/Andy-752109/sistema-reservas-api/wiki/Deployment-y-CICD): todas devolvieron HTTP 200. La actualización de métricas de Andy ya está en la Wiki mediante el commit `1454387` y debe conservarse.

El acuerdo es mantener `docs/wiki/` como fuente. No se publican README, PUBLICACION-* ni este archivo de evidencia como páginas adicionales.

El 18 de noviembre se fusionó la actualización final en el [PR #105](https://github.com/Andy-752109/sistema-reservas-api/pull/105), commit `4c791a252b5a51f55107f4e3d5dac880f581b200`. Home se sincronizó mediante el commit de Wiki `b84e332`, descendiente de `1454387`: solo cambió Home y se conservaron la página de infraestructura y las imágenes de métricas. Las seis páginas publicadas y las tres imágenes respondieron HTTP 200. Se comprobó que Home incluye la actualización del 16 de noviembre y ya no indica que el CD web esté pendiente. Los enlaces a README y VERIFICACION apuntan a los archivos fuente del repositorio.

[Inicio](Home.md) · [Estado e instrucciones](README.md)
