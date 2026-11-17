# Guion de la demo

La demo muestra los criterios de evaluación en orden, en unos **30 minutos**. La parte en vivo (cambio → Dev → aprobación → Prod) tarda 12–15 minutos; mientras corre el CD se presentan APM, métricas y Terraform. El reparto respeta la revisión cruzada: Ramiro revisa a Ale y Ale revisa a Andy.

## Preparación

### Un día antes

- [ ] Ensayo completo con un texto de prueba, midiendo el tiempo real de cada paso, y **grabado** (plan B).
- [ ] `develop` y `main` del web con la misma versión y el mismo contenido (los merge commits pueden tener SHA distinto) y **sin PR abiertos ni auto-merge pendientes** que puedan cruzarse con el de la demo.
- [ ] [Tablero del proyecto](https://github.com/users/Andy-752109/projects/2) público o con acceso para el profe, con las vistas Tablero, Por épica y Por milestone (#65).
- [ ] [Home de la Wiki](Home.md) actualizada con la liberación del web (#97).
- [ ] Consulta KQL **"Demo · trazas y errores"** guardada en el Application Insights de Prod.
- [ ] Credenciales de admin de Prod probadas (las tiene Andy) y una cuenta de estudiante creada.
- [ ] Capturas del plan B: run del CD del 16 de noviembre, Dev y Prod con el footer, dashboard y consulta de APM.

### 30 minutos antes

- [ ] Los tres con sesión iniciada en GitHub. Ale con la pestaña de [PR del web](https://github.com/Andy-752109/sistema-reservas-web/pulls) abierta.
- [ ] Portal de Azure con sesión: dashboard **Sistema de Reservas · Métricas** y `reservas-appi-prod-westus3` → **Logs** abiertos.
- [ ] [Health de Dev](https://reservas-api-dev-rw39me.azurewebsites.net/health) y [Health de Prod](https://reservas-api-prod-rw39me.azurewebsites.net/health) responden `"database":"up"`, y el web carga en los dos. Esto despierta los contenedores (evita el arranque en frío durante la demo).
- [ ] VS Code abierto en `sistema-reservas-web`, en `develop` actualizado, con el texto del cambio listo para copiar.
- [ ] [Swagger de Prod](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) abierto y **autorizado** (pasos en "Swagger responde 401", abajo), y una reserva **ACTIVA en fecha futura** para provocar el 409.

## Guion

| # | Criterio | Quién | Qué mostrar | Min |
| --- | --- | --- | --- | --- |
| 1 | Descripción del proyecto | Ramiro | Wiki: [Home](Home.md), [Descripción](Descripcion.md) y [Componentes](Componentes.md) (diagrama de clases). Plan de trabajo en el [tablero](https://github.com/users/Andy-752109/projects/2): épicas, historias y tareas cerradas. | 3 |
| 2 | Descripción de la tecnología | Ale | Wiki: [Stack y ramas](Stack-y-ramas.md); diagramas de [Infraestructura](Infraestructura.md) y de [Deployment y CI/CD](Deployment-y-CICD.md). | 2 |
| 3 | Estrategia de ramas | Andy | Diagrama GitFlow, protecciones de `main` y `develop`, y la lista de PR fusionados con su revisión. | 2 |
| 4 | Realizar un cambio en el código | Ale | Mostrar Prod antes. En VS Code: rama `feature/demo-texto-inicio`; en `src/pages/Inicio.tsx`, debajo del `<h1>`, agregar `<p>Reserva cubículos, laboratorios y canchas sin empalmes.</p>`. Commit, push y PR a `develop`. | 2 |
| 5 | Autorizar el PR | Ramiro | CI en verde → Approve → se fusiona solo. Después, PR `develop` → `main`: Ramiro lo aprueba y Ale lo fusiona. | 3 |
| 6 | Pipeline en Dev y resultado de pruebas | Andy | Run del CD del web: job de pruebas con su resumen y cobertura, imagen con el SHA y despliegue a Dev con smoke test. Para el backend, el CI de la API con su cobertura. | — |
| — | Mientras corre el CD | Ramiro, Andy | Adelantar los puntos 10, 11 y 12. | 5 |
| 7 | Proyecto publicado en Dev | Ale | [Web de Dev](https://reservas-web-dev-rw39me.azurewebsites.net): la frase nueva y el footer "DEV · SHA nuevo". | 1 |
| 8 | Aprobar el pipeline a Prod | Andy | Review deployments → production → comentario → Approve and deploy. | 1 |
| 9 | Cambio en Prod (URL pública) | Ale | [Web de Prod](https://reservas-web-prod-rw39me.azurewebsites.net): la frase y el footer "PROD · SHA nuevo". Recargar sin caché si sigue la versión anterior (Cmd + Shift + R en macOS, Ctrl + F5 en Windows). | 3 |
| 10 | APM: trazas, errores y mensajes | Ramiro | Reservar y cancelar en el web; en Swagger, `POST /reservas` empalmado → 409. Correr la consulta guardada: `reserva.traslape` (Warning), `reserva.creada` y `reserva.cancelada` (Info) y los 401. Los datos tardan 1–3 min en aparecer. | 4 |
| 11 | Métricas: CPU, memoria y requests | Andy | Dashboard **Sistema de Reservas · Métricas**: CPU y memoria del App Service Plan, requests, 5xx y tiempo de respuesta. | 2 |
| 12 | Terraform | Andy | [Repo de infraestructura](https://github.com/Andy-752109/sistema-reservas-infra): archivos `.tf`, state remoto y un `terraform plan` con "No changes". | 2 |

## Si algo falla (plan B)

| Qué pasa | Qué hacer |
| --- | --- |
| El CI del PR queda en "workflows awaiting approval" | Andy da clic en **Approve workflows to run**. Nunca marcar "bypass rules". |
| El PR a `main` pierde la aprobación | Entró otro commit a `develop`. Pedir otra aprobación; por eso no debe haber PR abiertos ese día. |
| El CD tarda más de lo esperado | Seguir con APM, métricas y Terraform, y regresar a Dev y Prod al final. |
| Falla el despliegue o el smoke test **de Dev** | El job de Prod no se inicia: Prod sigue con la versión anterior. Explicarlo como parte del diseño (el pipeline se detiene antes de Prod) y mostrar el [run exitoso del 16 de noviembre](https://github.com/Andy-752109/sistema-reservas-web/actions/runs/43815081376). |
| Falla el despliegue o el smoke test **de Prod** | La imagen nueva ya se envió a Prod y el CD **no tiene rollback automático**: no afirmar que Prod quedó intacto ni que se revirtió. Detener la demostración de la liberación, revisar el estado con Andy y usar como evidencia el [run exitoso del 16 de noviembre](https://github.com/Andy-752109/sistema-reservas-web/actions/runs/43815081376). |
| Prod sigue mostrando la versión anterior | Esperar 1–2 min (reinicio del contenedor) y recargar sin caché: Cmd + Shift + R en macOS, Ctrl + F5 en Windows. |
| "No se pudo conectar con el servidor" en el web | La API está despertando (arranque en frío). Esperar unos segundos y reintentar. |
| Swagger responde 401 | 1. Ejecutar `POST /login` con credenciales válidas del ambiente. 2. Copiar el `access_token` de una respuesta **200** (empieza con `eyJ`). 3. Dar clic en **Authorize**, pegar el token y confirmar con **Authorize** → **Close**. 4. Repetir la operación protegida. Si el token venció, obtener otro con `POST /login`. Si `POST /login` responde 401, las credenciales son incorrectas: confirmarlas por privado con Andy. Las credenciales nunca se escriben en este documento. |
| No aparecen las trazas en APM | Esperar 1–3 min; mientras, mostrar las del 16 de noviembre ampliando el rango de la consulta. |
| Falla algo que no se puede recuperar en vivo | Mostrar la grabación del ensayo. |

## Enlaces

| Grupo | Enlaces |
| --- | --- |
| GitHub | [Wiki](https://github.com/Andy-752109/sistema-reservas-api/wiki) · [Tablero](https://github.com/users/Andy-752109/projects/2) · [PR del web](https://github.com/Andy-752109/sistema-reservas-web/pulls) · [Actions del web](https://github.com/Andy-752109/sistema-reservas-web/actions) · [Actions de la API](https://github.com/Andy-752109/sistema-reservas-api/actions) · [Repo de infra](https://github.com/Andy-752109/sistema-reservas-infra) |
| Ambientes | [Web Dev](https://reservas-web-dev-rw39me.azurewebsites.net) · [Web Prod](https://reservas-web-prod-rw39me.azurewebsites.net) · [Swagger Prod](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) · [Health Dev](https://reservas-api-dev-rw39me.azurewebsites.net/health) · [Health Prod](https://reservas-api-prod-rw39me.azurewebsites.net/health) |
| Plan B | [CD del web, 16 nov](https://github.com/Andy-752109/sistema-reservas-web/actions/runs/43815081376) · [CD de la API, 13 nov](https://github.com/Andy-752109/sistema-reservas-api/actions/runs/43512516484) · Portal de Azure → dashboard "Sistema de Reservas · Métricas" · Grabación del ensayo: _pendiente_ |
