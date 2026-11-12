# Sistema de Reservas de Espacios Universitarios

Documentación del proyecto de **Infraestructura para el Desarrollo Continuo (ITESO)**. El sistema permite consultar y reservar cubículos de estudio, laboratorios y canchas, evitando reservas activas que se traslapen en un mismo espacio.

## Índice de la Wiki

| Página | Contenido | Estado |
|--------|-----------|--------|
| [Inicio](https://github.com/Andy-752109/sistema-reservas-api/wiki) | Índice, repositorios, tablero y ambientes | Contenido preparado en el issue #14 |
| [Descripción](https://github.com/Andy-752109/sistema-reservas-api/wiki/Descripcion) | Problema, usuarios, alcance y equipo | Contenido preparado en el issue #14 |
| Componentes, métodos y diagrama de clases | Modelo del sistema y responsabilidades | Pendiente: [issue #15](https://github.com/Andy-752109/sistema-reservas-api/issues/15) |
| Stack tecnológico y estrategia de ramas | Tecnologías y flujo de colaboración | Pendiente: [issue #16](https://github.com/Andy-752109/sistema-reservas-api/issues/16) |
| Infraestructura Dev y Prod | Recursos y conexiones entre ambientes | Pendiente: [issue #18](https://github.com/Andy-752109/sistema-reservas-api/issues/18) |
| Deployment y CI/CD | Construcción, pruebas y despliegue | Pendiente: [issue #19](https://github.com/Andy-752109/sistema-reservas-api/issues/19) |

Los enlaces de Inicio y Descripción corresponden a su ubicación de publicación en la Wiki. Mientras se publica el issue #14, pueden revisarse los archivos fuente en `docs/wiki/` del PR correspondiente. Las secciones pendientes se enlazan a sus issues hasta que existan sus páginas.

## Repositorios y seguimiento

- [API: sistema-reservas-api](https://github.com/Andy-752109/sistema-reservas-api): backend NestJS, Prisma, PostgreSQL y pruebas; también concentra los issues y la infraestructura como código.
- [Web: sistema-reservas-web](https://github.com/Andy-752109/sistema-reservas-web): frontend React, TypeScript y Vite.
- [Tablero del proyecto](https://github.com/users/Andy-752109/projects/2): prioridades y seguimiento del trabajo.
- [Issues del proyecto](https://github.com/Andy-752109/sistema-reservas-api/issues): requisitos, criterios de aceptación y responsables.
- [README de la API](https://github.com/Andy-752109/sistema-reservas-api/blob/develop/README.md) y [README de la web](https://github.com/Andy-752109/sistema-reservas-web/blob/develop/README.md): instrucciones de cada repositorio.

## Ambientes

Se contemplan dos ambientes en Azure: **Dev**, para validar la integración, y **Prod**, para la versión aprobada. La infraestructura y los pipelines se documentan en sus issues; esta página no supone que ya estén desplegados.

| Ambiente | Frontend | API | Swagger / salud |
|----------|----------|-----|-----------------|
| Dev | URL pendiente de confirmación por infraestructura | URL pendiente de confirmación por infraestructura | Pendientes de la URL de la API Dev |
| Prod | URL pendiente de confirmación por infraestructura | URL pendiente de confirmación por infraestructura | Pendientes de la URL de la API Prod |

Al confirmar cada URL pública, se agregarán enlaces HTTPS al frontend, a la API y a sus rutas `/api/docs` y `/health`. No deben sustituirse por nombres de recursos supuestos, localhost ni cadenas de conexión de PostgreSQL.

**Estado verificado el 6 de noviembre de 2026:** no se encontraron URLs públicas documentadas, homepage configurada ni despliegues registrados en GitHub en ninguno de los dos repositorios. Esto no descarta un despliegue realizado por otra vía; falta confirmar las direcciones con infraestructura.

## Equipo

| Integrante | Cuenta | Responsabilidad |
|------------|--------|-----------------|
| Ramiro Santos Rojas | [g2Ramiro](https://github.com/g2Ramiro) | Backend, base de datos y pruebas |
| Andrea Lizeth Arévalo Solis | [Andy-752109](https://github.com/Andy-752109) | DevOps, infraestructura y tablero |
| Alejandra Viera Huerta | [alebonita](https://github.com/alebonita) | Frontend y experiencia de usuario |

Para conocer los usuarios y los límites funcionales, consulta [Descripción del proyecto](https://github.com/Andy-752109/sistema-reservas-api/wiki/Descripcion).
