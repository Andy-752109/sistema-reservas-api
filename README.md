# Sistema de Reservas de Espacios Universitarios — API

API REST desarrollada en **NestJS + TypeScript** para la gestión y reserva de espacios compartidos de la universidad (cubículos de estudio, laboratorios y canchas). Impide que dos reservas de un mismo espacio se traslapen y deja registro de quién reservó qué y cuándo.

El proyecto se desarrolla para la materia **Infraestructura para el Desarrollo Continuo** (ITESO) e incluye un flujo completo de integración y entrega continua: pruebas automáticas, publicación de la imagen en **Docker Hub** y despliegue en **Azure App Service**.

**Equipo**

- Ramiro Santos Rojas
- Andrea Lizeth Arévalo Solis
- Alejandra Viera Huerta

---

## Tabla de contenido

1. [Problema que resuelve](#problema-que-resuelve)
2. [Usuarios y alcance](#usuarios-y-alcance)
3. [Modelo de dominio](#modelo-de-dominio)
4. [Stack tecnológico](#stack-tecnológico)
5. [Arquitectura e infraestructura](#arquitectura-e-infraestructura)
6. [Pipeline CI/CD](#pipeline-cicd)
7. [Puesta en marcha local](#puesta-en-marcha-local)
8. [Variables de entorno](#variables-de-entorno)
9. [Estructura del repositorio](#estructura-del-repositorio)
10. [Estrategia de ramas (GitFlow)](#estrategia-de-ramas-gitflow)
11. [Gestión del trabajo](#gestión-del-trabajo)

---

## Problema que resuelve

Los espacios compartidos de la universidad tienen mucha demanda y horarios limitados. Si no hay un solo lugar donde consultar la disponibilidad, un espacio puede quedar apartado dos veces para la misma hora o quedarse vacío porque nadie sabía que estaba libre.

El sistema reúne en un solo lugar el catálogo de espacios y sus horarios, **impide que dos reservas se traslapen** y guarda el historial de reservas. Como referencia funcional se toma el sistema de reservas que ya tiene la biblioteca de la universidad.

## Usuarios y alcance

| Rol | Capacidades |
|-----|-------------|
| **Estudiante / Docente** | Consulta disponibilidad; crea, cancela y confirma sus propias reservas. |
| **Administrador** | Da de alta espacios, gestiona usuarios y reservas para que cumplan los requisitos. |

**Incluye:** registro e inicio de sesión, catálogo de espacios y reservas con validación de traslapes.
**No incluye:** pagos, notificaciones por correo ni aplicación móvil.

## Modelo de dominio

```
┌──────────────┐ 1      realiza      0..* ┌──────────────┐ 0..*     ocupa     1 ┌──────────────┐
│   Usuario    │──────────────────────────│   Reserva    │──────────────────────│   Espacio    │
├──────────────┤                          ├──────────────┤                      ├──────────────┤
│ id: int      │                          │ id: int      │                      │ id: int      │
│ nombre       │                          │ usuarioId    │                      │ nombre       │
│ correo       │                          │ espacioId    │                      │ tipo         │
│ contrasena   │                          │ inicio       │                      │ capacidad    │
│ rol: Rol     │                          │ fin          │                      │ ubicacion    │
└──────────────┘                          │ estado       │                      │ activo: bool │
                                          └──────────────┘                      └──────────────┘
  «enum» Rol: ESTUDIANTE | DOCENTE | ADMIN      «enum» EstadoReserva: ACTIVA | CANCELADA | FINALIZADA
```

| Componente | Métodos |
|------------|---------|
| **Usuarios** | `crear()`, `consultar()`, `actualizar()`, `eliminar()`, `iniciarSesion(correo, contrasena): Token` |
| **Espacios** | `crear()`, `consultar()`, `actualizar()`, `eliminar()`, `verDisponibilidad(fecha): Horario[]` |
| **Reservas** | `crear()`, `consultar()`, `modificar()`, `cancelar()`, `validarTraslape(): bool` |

**Relaciones**

- Un usuario puede tener muchas reservas.
- Un espacio puede tener muchas reservas, pero **nunca dos al mismo tiempo**.
- Cada reserva pertenece a un solo usuario y a un solo espacio.

**Regla de traslape:** una reserva nueva `[inicio, fin)` choca con una reserva `ACTIVA` existente del mismo espacio cuando `existente.inicio < nueva.fin AND existente.fin > nueva.inicio`.

El esquema completo está en [`prisma/schema.prisma`](prisma/schema.prisma).

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime / lenguaje | Node.js, TypeScript |
| Framework | NestJS (módulos, controladores, servicios) |
| Base de datos | PostgreSQL (local con Docker; Azure Database for PostgreSQL en la nube) |
| ORM | Prisma |
| Autenticación | JWT + Passport, control de acceso por rol (Guards) |
| Validación | class-validator / class-transformer |
| Pruebas | Jest |
| Documentación | Swagger / OpenAPI (`/api/docs`) |
| Contenedores | Docker (build multi-stage), Docker Hub |
| CI/CD | GitHub Actions |
| Nube | Microsoft Azure: App Service, Azure Database for PostgreSQL, App Configuration, Application Insights |
| Gestión | GitHub Projects |

## Arquitectura e infraestructura

```
Desarrollador → GitHub → GitHub Actions → Pruebas unitarias → Docker → Docker Hub → Azure → PostgreSQL
```

Recursos en Azure (Resource Group `reservas-rg`):

| Recurso | Propósito |
|---------|-----------|
| **Azure App Service** (+ App Service Plan `reservas-plan`) | Ejecuta la API NestJS como contenedor Docker obtenido de Docker Hub. |
| **Azure Database for PostgreSQL** (`reservas-db`) | Persistencia de usuarios, espacios y reservas; conexión vía Prisma con SSL. |
| **Azure App Configuration / App Settings** | Variables de entorno y secretos (`JWT_SECRET`, `DATABASE_URL`, …). |
| **Application Insights** | Logs, errores, métricas de rendimiento y trazas de solicitudes. |
| **Azure Static Web Apps** *(propuesta)* | Frontend React + TypeScript + Vite que consume la API vía HTTPS. |

Flujo del sistema:

1. El equipo envía cambios al repositorio de GitHub.
2. GitHub Actions se ejecuta automáticamente.
3. Se instalan dependencias, se ejecutan las pruebas, se compila el proyecto y se construye la imagen Docker.
4. La imagen se publica en Docker Hub (`reservas-api`).
5. Azure App Service obtiene la imagen de Docker Hub y despliega la aplicación.
6. La API se conecta a Azure Database for PostgreSQL.
7. La API queda accesible desde Internet (clientes / Postman).

Se priorizan recursos gratuitos o de bajo costo de Azure, adecuados a un proyecto académico.

## Pipeline CI/CD

| Disparador | Jobs |
|------------|------|
| Pull Request a `develop` o `main` | `npm ci` → `npm test` (Jest) → `npm run build` |
| Merge / push a `main` | Lo anterior + build de imagen Docker → push a Docker Hub con tags `latest` y `<commit-sha>` → despliegue en Azure App Service |

Secrets requeridos en GitHub Actions: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` y las credenciales de publicación de Azure (`AZURE_WEBAPP_PUBLISH_PROFILE` o service principal).

## Puesta en marcha local

**Requisitos:** Node.js 20+, npm, Docker y Docker Compose.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Andy-752109/sistema-reservas-api.git
cd sistema-reservas-api

# 2. Variables de entorno
cp .env.example .env

# 3. Levantar PostgreSQL local
docker compose up -d

# 4. Instalar dependencias y aplicar migraciones de Prisma
npm install
npx prisma migrate dev --name init

# 5. Ejecutar la API en modo desarrollo
npm run start:dev
```

- API: <http://localhost:3000>
- Swagger: <http://localhost:3000/api/docs>

Para levantar la base de datos y la API en contenedores (cuando exista el `Dockerfile`):

```bash
docker compose --profile full up -d --build
```

Pruebas:

```bash
npm test          # pruebas unitarias
npm run test:cov  # cobertura
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión de Prisma | `postgresql://reservas:reservas@localhost:5432/reservas_db?schema=public` |
| `JWT_SECRET` | Secreto para firmar los tokens JWT | `cambia-este-secreto` |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `PORT` | Puerto HTTP de la API | `3000` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Configuración del contenedor PostgreSQL local | `reservas` / `reservas` / `reservas_db` / `5432` |

## Estructura del repositorio

```
sistema-reservas-api/
├── .github/workflows/     # Pipelines de GitHub Actions (CI / CD)
├── prisma/
│   ├── schema.prisma      # Modelos Usuario, Espacio, Reserva y enums
│   └── migrations/        # Migraciones generadas por Prisma
├── src/
│   ├── auth/              # JWT, Passport, Guards de roles
│   ├── usuarios/          # Módulo de usuarios
│   ├── espacios/          # Módulo de espacios y disponibilidad
│   ├── reservas/          # Módulo de reservas y validación de traslapes
│   ├── prisma/            # PrismaService
│   └── main.ts            # Bootstrap + Swagger
├── test/                  # Pruebas
├── Dockerfile             # Build multi-stage
├── docker-compose.yml     # PostgreSQL local (+ API opcional)
├── .env.example
└── README.md
```

## Estrategia de ramas (GitFlow)

| Rama | Propósito |
|------|-----------|
| `main` | Solo versiones estables listas para producción. Cada merge dispara la publicación en Docker Hub y el despliegue en Azure. |
| `develop` | Rama de integración de las funcionalidades terminadas; aquí se validan los cambios antes de pasarlos a producción. |
| `feature/*` | Una rama por funcionalidad, creada desde `develop` (p. ej. `feature/authentication`, `feature/spaces`, `feature/reservations`). |

Flujo: `feature/*` → PR a `develop` (CI) → PR de `develop` a `main` (CI + CD).

## Gestión del trabajo

El backlog, los issues y su avance se gestionan en **GitHub Projects** (tablero *“Sistema de Reservas - Tablero de Trabajo”*) con las etiquetas `backend`, `database`, `devops`, `testing` y `documentation`.
