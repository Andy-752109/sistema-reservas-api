# Verificación de accesos — issue #69

Fecha: **16 de noviembre de 2026**. Comprobaciones de lectura sin autenticación
contra enlaces públicos y metadatos de GitHub/Docker Hub. No se modificaron permisos,
cuentas, datos ni recursos Azure.

## Repositorios y documentación

| Recurso | Resultado |
|---------|-----------|
| [API](https://github.com/Andy-752109/sistema-reservas-api) | Metadatos públicos: `private=false` |
| [Web](https://github.com/Andy-752109/sistema-reservas-web) | Metadatos públicos: `private=false` |
| [Infraestructura](https://github.com/Andy-752109/sistema-reservas-infra) | Metadatos públicos: `private=false` |
| [Tablero](https://github.com/users/Andy-752109/projects/2) | HTTP 200 sin autenticación; destino permanece en el Project |
| [Wiki Home](https://github.com/Andy-752109/sistema-reservas-api/wiki) | HTTP 200 sin autenticación |
| [Wiki Descripcion](https://github.com/Andy-752109/sistema-reservas-api/wiki/Descripcion) | HTTP 200 sin autenticación |
| [Wiki Infraestructura](https://github.com/Andy-752109/sistema-reservas-api/wiki/Infraestructura) | HTTP 200 sin autenticación |

Estas comprobaciones acreditan disponibilidad pública de los enlaces, no que el
profesor haya recibido el paquete ni que se hayan verificado sus cuentas personales.
La revisión de las columnas y del estado final de las tareas corresponde al ensayo.

## Ambientes

| Comprobación | Dev | Prod |
|--------------|-----|------|
| Web por HTTPS | HTTP 200 | HTTP 200 |
| Swagger por HTTPS | HTTP 200 | HTTP 200 |
| `config.js`: versión Web | `7d33986` | `7d33986` |
| `config.js`: ambiente | `DEV` | `PROD` |
| `config.js`: API | API de Dev | API de Prod |
| `/health`: estado / base | `ok` / `up` | `ok` / `up` |
| `/health`: versión API | `18f279a2f56096cf7209c51d40880547a2339d72` | `18f279a2f56096cf7209c51d40880547a2339d72` |

Los enlaces exactos están en el [índice de entrega](README.md). La comprobación
anónima no reproduce el flujo autenticado ni garantiza disponibilidad en la fecha
de presentación; debe repetirse antes de la demo.

## Docker Hub

Se consultaron sin autenticación los metadatos públicos de los repositorios y sus
tags. Ambos devuelven `is_private=false`; no fue necesario iniciar sesión ni se
descargaron las capas completas de las imágenes.

| Imagen | Tag | Digest publicado |
|--------|-----|------------------|
| `andreaarv/reservas-api` | `18f279a` | `sha256:e6f2fa5136ece211ae02e43c0a8d86674d84ea311921fe85911f85eb078f5044` |
| `andreaarv/reservas-web` | `7d33986` | `sha256:31fda8cee81deb2ea83cc57db5003c4bb0bc6764e071e6659d045f6f68758d43` |

Referencias: [API en Docker Hub](https://hub.docker.com/r/andreaarv/reservas-api/tags)
y [Web en Docker Hub](https://hub.docker.com/r/andreaarv/reservas-web/tags).

## Pendientes para completar la entrega

- Confirmar recepción de enlaces y cuentas necesarias por el profesor.
- Consultar la rúbrica respecto al portal de Azure; el checklist de demo no basta
  para deducir que deba concederse acceso individual.
- Presentación confirmada por Ramiro: jueves **19 de noviembre de 2026**, entre
  **18:00 y 20:00**, hora de Ciudad de México. Falta confirmar los responsables de
  disponibilidad y apagado, el momento acordado de apagado posterior y la ejecución real.
- Completar las capturas y la consulta guardada de APM con el equipo.
- Sincronizar la actualización final de Home después del merge del #105.

No se marca el #69 como terminado ni se concede acceso al portal. La confirmación
del apagado debe registrarse después de realizarlo, no anticipadamente.

[Volver al índice](README.md)
