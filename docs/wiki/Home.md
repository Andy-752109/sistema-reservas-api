# Sistema de Reservas de Espacios Universitarios

Documentación del proyecto de **Infraestructura para el Desarrollo Continuo (ITESO)**. El sistema permite consultar y reservar cubículos de estudio, laboratorios y canchas, evitando reservas activas que se traslapen en un mismo espacio.

## Índice de la Wiki

| Página | Contenido | Estado |
|--------|-----------|--------|
| [Inicio](Home.md) | Índice, repositorios, tablero y ambientes | Integrado en el [PR #84](https://github.com/Andy-752109/sistema-reservas-api/pull/84); actualización #97 |
| [Descripción](Descripcion.md) | Problema, usuarios, alcance y equipo | Integrado en el PR #84 |
| [Componentes, métodos y diagrama de clases](Componentes.md) | Modelo del sistema y responsabilidades | Integrado en el [PR #83](https://github.com/Andy-752109/sistema-reservas-api/pull/83); actualización #97 |
| [Stack tecnológico y estrategia de ramas](Stack-y-ramas.md) | Tecnologías y flujo de colaboración | Publicado en el repositorio mediante el [PR #85](https://github.com/Andy-752109/sistema-reservas-api/pull/85) (issue #16) |
| [Infraestructura Dev y Prod](Infraestructura.md) | Recursos y conexiones entre ambientes | Integrado en el [PR #100](https://github.com/Andy-752109/sistema-reservas-api/pull/100) |
| [Deployment y CI/CD](Deployment-y-CICD.md) | Construcción, pruebas y despliegue | Integrado en el [PR #101](https://github.com/Andy-752109/sistema-reservas-api/pull/101); CD de Web pendiente del #53 |

El índice enlaza los Markdown disponibles en `docs/wiki/`. «Integrado» o «publicado en el repositorio» no significa publicado en la pestaña Wiki de GitHub. El estado de entrega y las instrucciones para publicar se mantienen en [README](README.md).

## Repositorios y seguimiento

- [API: sistema-reservas-api](https://github.com/Andy-752109/sistema-reservas-api): backend NestJS, Prisma, PostgreSQL, pruebas e issues del proyecto.
- [Web: sistema-reservas-web](https://github.com/Andy-752109/sistema-reservas-web): frontend React, TypeScript y Vite.
- [Infraestructura: sistema-reservas-infra](https://github.com/Andy-752109/sistema-reservas-infra): Terraform, recursos Azure y estado remoto.
- [Tablero del proyecto](https://github.com/users/Andy-752109/projects/2): prioridades y seguimiento del trabajo.
- [Issues del proyecto](https://github.com/Andy-752109/sistema-reservas-api/issues): requisitos, criterios de aceptación y responsables.
- [README de la API](https://github.com/Andy-752109/sistema-reservas-api/blob/develop/README.md) y [README de la web](https://github.com/Andy-752109/sistema-reservas-web/blob/develop/README.md): instrucciones de cada repositorio.

## Ambientes

Hay dos ambientes en Azure: **Dev**, para validar la integración, y **Prod**, para la versión aprobada. Las URLs de Swagger de la API fueron entregadas por Andy el 12 de noviembre de 2026. Las URLs de Web se contrastaron con los nombres definidos en Terraform y se verificaron por HTTPS, incluida la configuración pública `config.js` de cada ambiente.

| Ambiente | Frontend | API | Swagger | Salud |
|----------|----------|-----|---------|-------|
| Dev | [Web Dev](https://reservas-web-dev-rw39me.azurewebsites.net) | [API Dev](https://reservas-api-dev-rw39me.azurewebsites.net) | [Swagger Dev](https://reservas-api-dev-rw39me.azurewebsites.net/api/docs) | [Health Dev](https://reservas-api-dev-rw39me.azurewebsites.net/health) |
| Prod | [Web Prod](https://reservas-web-prod-rw39me.azurewebsites.net) | [API Prod](https://reservas-api-prod-rw39me.azurewebsites.net) | [Swagger Prod](https://reservas-api-prod-rw39me.azurewebsites.net/api/docs) | [Health Prod](https://reservas-api-prod-rw39me.azurewebsites.net/health) |

**Actualización del 13 de noviembre de 2026:** la primera liberación de la API por CD ([PR #103](https://github.com/Andy-752109/sistema-reservas-api/pull/103), [run 43512516484](https://github.com/Andy-752109/sistema-reservas-api/actions/runs/43512516484)) finalizó correctamente, con aprobación manual de Prod. `/health` de Dev y Prod devuelve `status: ok`, `database: up` y el mismo SHA `18f279a2f56096cf7209c51d40880547a2339d72`. Ambos catálogos exponen los seis espacios de ejemplo. Web aún indica `version: pendiente` hasta el CD del #53; `config.js` distingue `DEV`/`PROD` y apunta a su API. Las comprobaciones y sus límites están en [VERIFICACION-97.md](VERIFICACION-97.md): no acreditan el funcionamiento completo de login, catálogo y reservas desde la interfaz.

## Equipo

| Integrante | Cuenta | Responsabilidad |
|------------|--------|-----------------|
| Ramiro Santos Rojas | [g2Ramiro](https://github.com/g2Ramiro) | Backend, base de datos y pruebas |
| Andrea Lizeth Arévalo Solis | [Andy-752109](https://github.com/Andy-752109) | DevOps, infraestructura y tablero |
| Alejandra Viera Huerta | [alebonita](https://github.com/alebonita) | Frontend y experiencia de usuario |

Para conocer los usuarios y los límites funcionales, consulta [Descripción del proyecto](Descripcion.md).
