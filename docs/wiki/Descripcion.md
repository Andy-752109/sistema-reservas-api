# Descripción del proyecto

## Problema

Los espacios compartidos de la universidad tienen demanda y horarios limitados. Cuando la disponibilidad y los apartados se consultan por medios separados, dos personas pueden reservar el mismo espacio para horas coincidentes o desconocer que un espacio está libre.

El Sistema de Reservas reúne el catálogo, la disponibilidad y las reservas en una aplicación web respaldada por una API. Su regla principal impide que dos reservas **ACTIVAS** de un mismo espacio se traslapen. El historial permite identificar quién reservó un espacio y en qué intervalo. Como referencia funcional se toma el servicio de reservas de la biblioteca de la universidad.

El proyecto se desarrolla para **Infraestructura para el Desarrollo Continuo (ITESO)**. Además de la funcionalidad de reservas, contempla demostrar pruebas automáticas, integración y entrega continua, despliegue en Azure con ambientes Dev/Prod y observabilidad.

## Usuarios

| Rol | Necesidad y funciones previstas |
|-----|--------------------------------|
| Estudiante | Consultar espacios y disponibilidad; crear, consultar, modificar y cancelar sus propias reservas |
| Docente | Reservar espacios para actividades académicas, con las mismas operaciones sobre sus propias reservas |
| Administrador | Gestionar el catálogo de espacios y usuarios; consultar y gestionar reservas de otros usuarios según los permisos de la API |

La autenticación usa JWT y el acceso se controla por rol y propiedad de la reserva. El usuario de una nueva reserva se obtiene de la identidad autenticada. El rol ADMIN no es una opción de autorregistro público; su aprovisionamiento corresponde al procedimiento autorizado del backend.

## Alcance incluido

- Registro e inicio de sesión y control de acceso de estudiantes, docentes y administradores.
- Catálogo de cubículos de estudio, laboratorios y canchas, con capacidad, ubicación y estado activo.
- Consulta de disponibilidad para elegir un espacio y un intervalo.
- Creación, consulta, modificación y cancelación de reservas, con validación de traslapes también ante solicitudes concurrentes.
- Conservación del registro de las reservas canceladas; no bloquean nuevos intervalos.
- API NestJS y frontend React en repositorios separados, con PostgreSQL y Prisma para persistencia.
- Pruebas, documentación de la API, contenedores y un flujo de CI/CD con ambientes Dev/Prod en Azure.
- Observabilidad mediante Application Insights para solicitudes, dependencias, trazas de negocio y errores.

Este alcance describe el objetivo del proyecto. El estado de entrega de cada funcionalidad se consulta en sus issues y PR; una implementación en revisión no implica que ya esté integrada o desplegada.

## Regla de reservas

Los intervalos se consideran como `[inicio, fin)`: incluyen el inicio y excluyen el final. Existe traslape cuando una reserva ACTIVA del mismo espacio cumple simultáneamente:

```text
existente.inicio < nueva.fin
existente.fin > nueva.inicio
```

Por ejemplo, una reserva de 10:00 a 11:00 permite otra de 11:00 a 12:00, pero rechaza una de 10:30 a 11:30. Se requiere inicio anterior a fin y un espacio activo. Las fechas de la API incluyen zona horaria explícita.

## Fuera de alcance

- Pagos o cobros por reservar espacios.
- Notificaciones por correo electrónico.
- Aplicación móvil nativa.

## Equipo y responsabilidades

| Integrante | Cuenta de GitHub | Área responsable |
|------------|------------------|------------------|
| Ramiro Santos Rojas | [g2Ramiro](https://github.com/g2Ramiro) | API, lógica de negocio, base de datos, pruebas y documentación asignada al backend |
| Andrea Lizeth Arévalo Solis | [Andy-752109](https://github.com/Andy-752109) | Contenedores, CI/CD, Terraform, recursos Azure y gestión del tablero |
| Alejandra Viera Huerta | [alebonita](https://github.com/alebonita) | Frontend React, interfaz de reservas, pruebas y pipelines del frontend |

Los roles indican quién responde por cada área y permiten colaborar entre integrantes. Las asignaciones concretas y la revisión de cambios se mantienen en GitHub.

## Enlaces

- [Inicio e índice de la Wiki](https://github.com/Andy-752109/sistema-reservas-api/wiki).
- [Repositorio de la API](https://github.com/Andy-752109/sistema-reservas-api).
- [Repositorio del frontend](https://github.com/Andy-752109/sistema-reservas-web).
- [Tablero del proyecto](https://github.com/users/Andy-752109/projects/2).
- [Backlog y responsables](https://github.com/Andy-752109/sistema-reservas-api/issues).
