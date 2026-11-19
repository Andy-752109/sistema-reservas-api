# Entrega y accesos para evaluación — Sistema de Reservas

Índice para que el profesor revise el código, la documentación, los ambientes y
las evidencias del proyecto. Corresponde al [issue #69](https://github.com/Andy-752109/sistema-reservas-api/issues/69).
Los resultados de acceso se comprobaron el **16 de noviembre de 2026** y están en
[VERIFICACION-69.md](VERIFICACION-69.md).

## Enlaces del proyecto

| Recurso | Enlace | Qué permite revisar |
|---------|--------|---------------------|
| API | [sistema-reservas-api](https://github.com/Andy-752109/sistema-reservas-api) | NestJS, Prisma, pruebas, CI/CD y backlog |
| Web | [sistema-reservas-web](https://github.com/Andy-752109/sistema-reservas-web) | React, pantallas, pruebas y CI/CD |
| Infraestructura | [sistema-reservas-infra](https://github.com/Andy-752109/sistema-reservas-infra) | Terraform, estado remoto, recursos y dashboard |
| Tablero | [Sistema de Reservas — Project 2](https://github.com/users/Andy-752109/projects/2) | Planificación, responsables y seguimiento |
| Wiki | [Inicio e índice](https://github.com/Andy-752109/sistema-reservas-api/wiki) | Descripción, componentes, stack, infraestructura y despliegue |
| Fuentes de documentación | [docs/wiki](../wiki/README.md) | Markdown revisados por PR y mantenimiento de la Wiki |

Los tres repositorios, el tablero y la Wiki están disponibles públicamente.
El backlog original menciona dos repositorios; la entrega incluye también el tercero,
al que se trasladó Terraform. La publicación de este índice no confirma por sí sola
que el profesor recibió los enlaces: el equipo debe enviárselos y confirmar la entrega.

## Aplicación y API

| Ambiente | Aplicación web | API | Swagger | Salud |
|----------|----------------|-----|---------|-------|
| Dev | [Abrir Web Dev](https://reservas-web-dev-rw39me.azurewebsites.net) | [API Dev](https://reservas-api-dev-rw39me.azurewebsites.net) | [Swagger Dev](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs) | [Health Dev](https://reservas-api-dev-rw39me.azurewebsites.net/health) |
| Prod | [Abrir Web Prod](https://reservas-web-prod-rw39me.azurewebsites.net) | [API Prod](https://reservas-api-prod-rw39me.azurewebsites.net) | [Swagger Prod](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) | [Health Prod](https://reservas-api-prod-rw39me.azurewebsites.net/health) |

Versión web comprobada: `7d33986` en Dev y Prod. Versión API comprobada:
`18f279a2f56096cf7209c51d40880547a2339d72`, con `database: up` en ambos ambientes.
La disponibilidad observada hoy debe comprobarse de nuevo antes de la presentación.

El flujo de demostración es **login → catálogo → fecha futura → reservar → Mis
reservas → cancelar**. Para demostrar el 409, repetir el intervalo de una reserva
ACTIVA en fecha futura. La disponibilidad puede cambiar entre consultar y confirmar.

Las operaciones protegidas requieren cuenta. Andy custodia las credenciales de
administración por ambiente; las cuentas que necesite el profesor deben coordinarse
por un canal privado. Este índice público no contiene contraseñas ni tokens. Una
cuenta de aplicación es independiente de un eventual acceso al portal de Azure.

## Imágenes públicas de Docker Hub

| Imagen | Tag de la liberación comprobada | Página pública |
|--------|--------------------------------|----------------|
| `andreaarv/reservas-api` | `18f279a` | [API: tags](https://hub.docker.com/r/andreaarv/reservas-api/tags) |
| `andreaarv/reservas-web` | `7d33986` | [Web: tags](https://hub.docker.com/r/andreaarv/reservas-web/tags) |

Se verificó sin autenticación que ambos repositorios de imágenes son públicos y
que existen esos tags. Sus digests constan en la evidencia; los tags identifican
la liberación sin depender de cambios posteriores de `latest`.

## Evidencias de CI/CD, APM y métricas

| Evidencia | Referencia | Estado |
|-----------|------------|--------|
| Liberación API a Dev y Prod | [CD 43512516484](https://github.com/Andy-752109/sistema-reservas-api/actions/runs/43512516484) | Liberación registrada; evidencia del #97 |
| Liberación Web a Dev y Prod | [CD 43815081376](https://github.com/Andy-752109/sistema-reservas-web/actions/runs/43815081376) | Liberación registrada; evidencia del #97 |
| Documentación de despliegue | [Deployment y CI/CD](https://github.com/Andy-752109/sistema-reservas-api/wiki/Deployment-y-CICD) | Explica pipelines, imágenes y aprobación de Prod |
| Dashboard y capturas | [Infraestructura: métricas y dashboard](https://github.com/Andy-752109/sistema-reservas-api/wiki/Infraestructura) | Capturas y métricas documentadas por el equipo |
| Consulta de trazas y errores | [demo-apm.kql](../observability/demo-apm.kql) | Consulta fuente disponible |
| Comprobaciones del #97 | [VERIFICACION-97.md](../wiki/VERIFICACION-97.md) | Fuente de evidencia; actualización final en el [PR #105](https://github.com/Andy-752109/sistema-reservas-api/pull/105) |

Para la demo, comprobar con Andy que **Demo · trazas y errores** esté guardada en
Application Insights de Prod (`reservas-appi-prod-westus3`) y preparar el dashboard
**Sistema de Reservas · Métricas**. El archivo KQL y las capturas no acreditan por sí
solos una sesión del profesor en Azure ni una consulta recién ejecutada en el portal.

## Acceso al portal de Azure

**Pendiente de confirmar con la rúbrica:** si el profesor necesita entrar con su
propia cuenta o si evaluará el portal durante la demostración del equipo. El
checklist compartido exige que el equipo tenga el portal abierto, pero no determina
el permiso individual del profesor.

Si la evaluación exige acceso individual, coordinar con Andy la identidad del
profesor, los recursos necesarios y el alcance del acceso, con aprobación explícita
antes de modificar permisos. Si basta la demo, registrar esa confirmación y
preparar las evidencias. No se ha concedido acceso al portal como parte de este issue.

## Preparación de la presentación

Pendientes de completar con el equipo:

| Dato | Estado |
|------|--------|
| Fecha, hora y zona horaria de la presentación final | Jueves **19 de noviembre de 2026**, entre **18:00 y 20:00**, hora de Ciudad de México (`America/Mexico_City`), confirmada por Ramiro |
| Requisito de acceso del profesor al portal | Por confirmar con la rúbrica |
| Responsable de verificar Azure antes de la demo | Propuesta: Andy; falta confirmación |
| Responsable y momento de apagado posterior | Por confirmar con Andy, después de concluir la revisión acordada |
| Envío de este índice y cuentas de evaluación al profesor | Pendiente de confirmación de entrega |

### Un día antes

Miércoles **18 de noviembre**, antes de la presentación del jueves.

- Ensayar el flujo completo y medir el CD. Los 12–15 minutos del checklist son una
  estimación que debe contrastarse en el ensayo.
- Verificar que `develop` y `main` contienen la misma versión de Web. Con merge
  commits sus SHA pueden diferir: comprobar también contenido y ascendencia, y
  coordinar que no haya PR ni auto-merges que se crucen con el cambio de la demo.
- Revisar el tablero público y sus columnas, y la Home final del #97 después de
  sincronizar el PR #105 con la Wiki.
- Confirmar la consulta KQL guardada, las cuentas de Prod y la reserva ACTIVA futura.
- Preparar capturas del CD del 16 de noviembre, footers Dev/Prod, dashboard y APM.

### Treinta minutos antes

Preparar las comprobaciones desde las **17:30 del jueves 19 de noviembre** para
cubrir el inicio de la franja confirmada. Mantener disponibles los ambientes durante
la presentación y coordinar el apagado al concluir la revisión del profesor.

- Los tres integrantes con sesión en GitHub; personas revisoras preparadas según el
  reparto del equipo: Ramiro revisa a Ale y Ale revisa a Andy.
- Equipo con el portal y dashboard abiertos; Application Insights de Prod → Logs.
- Comprobar Web y `/health` en Dev/Prod, con `database: up` y versiones esperadas.
- Preparar VS Code en Web con `develop` actualizado y el texto del cambio de demo.
- Abrir Swagger de Prod y confirmar una reserva ACTIVA futura para el caso 409.

### Al terminar

Confirmar con el equipo y el profesor que concluyó la revisión que requiere los
ambientes disponibles. Andy debe ejecutar y verificar el apagado según el plan
acordado, conservando las evidencias y registrando qué recursos quedaron detenidos
y cuándo. Este documento no ejecuta cambios de infraestructura ni programa apagados.

## Estado del #69

- [x] Repositorios, tablero y Wiki accesibles públicamente en la comprobación anónima.
- [x] Imágenes Docker Hub públicas y tags de la liberación disponibles.
- [ ] Profesor informado y acceso necesario confirmado, incluido Azure si lo exige la rúbrica.
- [ ] Fecha y responsables operativos confirmados.
- [ ] Azure verificado encendido el día de la presentación y apagado después según lo acordado.

El #69 permanece abierto: la verificación actual y este índice no sustituyen la
entrega efectiva ni las comprobaciones del día de la presentación.
