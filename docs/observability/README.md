# Consulta de la demo

Abrir **Logs** desde `reservas-appi-prod-westus3`, pegar
[demo-apm.kql](demo-apm.kql) y guardar como **Demo · trazas y errores**.
Para Dev, usar el recurso de Application Insights de ese ambiente. La consulta usa
las tablas clásicas del recurso (`traces`, `exceptions`, `requests`); no ejecutarla
sin adaptar los nombres desde el workspace de Log Analytics.

La consulta conserva los eventos `reserva.creada`, `reserva.cancelada` y
`reserva.traslape`, los diagnósticos `api.error_5xx` y añade solicitudes HTTP 401,
409 y 5xx. Usa `resultCode`, no `success`, para incluir también los 401. Los eventos
de negocio y las solicitudes son registros distintos de la misma operación:
`operation_Id` permite relacionarlos; no se deben contar como reservas distintas.
Un `http.409` por sí solo no prueba un traslape: comprobar `reserva.traslape`.

Seleccionar el intervalo en el portal. Para la demo en vivo, elegir un intervalo
reciente; para recuperar las evidencias del 16 de noviembre de 2026, usar un rango
personalizado que incluya ese día. No hay un filtro fijo de 30 minutos en el archivo.
En Prod solo aparecerá la telemetría disponible en ese recurso aunque el filtro
admita los roles `api-dev` y `api-prod`.

## Comprobación con el equipo

1. Ejecutar el flujo autorizado de la demo: crear y cancelar una reserva futura;
   intentar el mismo intervalo ocupado para obtener 409; hacer una solicitud
   protegida sin token para obtener 401. No provocar un fallo de infraestructura
   en Prod para obtener 5xx: usar evidencia existente si hace falta.
2. Esperar la ingesta y comprobar eventos, códigos HTTP y correlación. Los campos
   de usuario o reserva pueden estar vacíos en solicitudes sin autenticación.
3. Guardar la consulta y las capturas sin tokens ni contraseñas.

Esta versión se preparó desde el código de telemetría y los requisitos de la
revisión del [PR #106](https://github.com/Andy-752109/sistema-reservas-api/pull/106).
No se obtuvo una exportación de la consulta guardada en Azure ni se ejecutó esta
versión contra el recurso; queda pendiente validarla y guardarla con Andy.

Referencia del esquema: [modelo de telemetría de Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/data-model-complete).
