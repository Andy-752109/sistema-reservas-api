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
| Frontend | React + TypeScript + Vite (repo `sistema-reservas-web`) |
| Infraestructura como código | Terraform (repo [`sistema-reservas-infra`](https://github.com/Andy-752109/sistema-reservas-infra)) |
| Nube | Microsoft Azure: App Service, Azure Database for PostgreSQL, Application Insights |
| Gestión | GitHub Projects |

## Arquitectura e infraestructura

```
Desarrollador → GitHub → GitHub Actions → Pruebas unitarias → Docker → Docker Hub → Azure → PostgreSQL
```

El sistema se reparte en tres repositorios:

| Repositorio | Contenido |
|-------------|-----------|
| `sistema-reservas-api` (este) | API NestJS, Prisma, pruebas, Dockerfile y pipelines del backend. Aquí viven los issues de los tres repos. |
| [`sistema-reservas-web`](https://github.com/Andy-752109/sistema-reservas-web) | Frontend React + TypeScript + Vite y sus pipelines. |
| [`sistema-reservas-infra`](https://github.com/Andy-752109/sistema-reservas-infra) | Terraform: crea los recursos de Azure de Dev y Prod. Los pipelines de API y web despliegan sobre esos recursos. |

Recursos en Azure (Resource Group `reservas-rg`), creados con Terraform, con dos ambientes: **Dev** y **Prod**.

| Recurso | Propósito |
|---------|-----------|
| **App Service Plan** `reservas-plan` (Linux B1) | Cómputo compartido por las 4 Web Apps; de aquí salen las métricas de CPU y memoria. |
| **Web Apps** `api-dev`, `api-prod` | Ejecutan la API como contenedor obtenido de Docker Hub. |
| **Web Apps** `web-dev`, `web-prod` | Ejecutan el frontend (nginx) como contenedor obtenido de Docker Hub. |
| **Azure Database for PostgreSQL Flexible Server** | Un servidor con dos bases: `reservas_dev` y `reservas_prod`; conexión vía Prisma con SSL. |
| **App Settings** de cada Web App | Variables de entorno y secretos (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, …). |
| **Application Insights** + Log Analytics | APM: requests, trazas, errores y mensajes personalizados por ambiente. |

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
| Pull Request a `develop` o `main` | `npm ci` → lint → `npm run test:cov` (Jest, resultados y cobertura publicados en el run) → `npm run build` |
| Merge / push a `main` | Pruebas → imagen Docker a Docker Hub (tags `<commit-sha>` y `latest`) → **deploy a Dev** → **aprobación manual** (environment `production`) → **deploy a Prod** con la misma imagen |

Cada deploy aplica `prisma migrate deploy` en la base del ambiente y hace un smoke test a `/health`.

Equivalente a las *service connections* de Azure DevOps: un service principal de Azure con credencial federada (OIDC) usado por `azure/login`, y un token de Docker Hub. Secrets requeridos: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

## Puesta en marcha local

**Requisitos:** Node.js 20.19+ (rama 20), 22.12+ (rama 22) o 24+, npm, Docker y Docker Compose.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Andy-752109/sistema-reservas-api.git
cd sistema-reservas-api

# 2. Variables de entorno
cp .env.example .env

# 3. Instalar dependencias con las versiones del lockfile
npm ci

# 4. Levantar PostgreSQL y esperar a que esté healthy
docker compose up -d --wait db

# 5. Aplicar las migraciones versionadas (incluida la inicial)
npm run prisma:deploy

# 6. Ejecutar la API en modo desarrollo
npm run start:dev
```

- API: <http://localhost:3000>
- `GET /` responde `Hello World!` para verificar el arranque.
- `PORT` se lee del entorno o de `.env`; si no está definido, se usa `3000`.

En PowerShell, usa `Copy-Item .env.example .env` para copiar la configuración. Si la política de ejecución bloquea `npm.ps1`, ejecuta los comandos con `npm.cmd` (por ejemplo, `npm.cmd run start:dev`).

La base de NestJS incluye los módulos `usuarios`, `espacios`, `reservas`, `auth` y `prisma`, y un `ValidationPipe` global con `whitelist: true`. `PrismaModule` exporta `PrismaService`: los módulos que necesiten consultar datos deben importar `PrismaModule` e inyectar el servicio. La conexión se establece durante el arranque de la API; PostgreSQL debe estar disponible. Al cerrar la aplicación se desconecta Prisma. Swagger está disponible en `/api/docs`.

Se fijan `prisma`, `@prisma/client` y `@prisma/adapter-pg` en `7.10.1`. `prisma.config.ts` lee `DATABASE_URL` para las migraciones y `PrismaService` usa `ConfigService` para la conexión de la API. El generador produce un cliente CommonJS en `src/generated/prisma/`, excluido de Git y regenerado en cada instalación. El lockfile se mantiene con npm 10 y se comprueba con `npx npm@10 ci`.

`npm ci` genera Prisma Client mediante `postinstall`, sin conectarse a PostgreSQL. Si cambia el esquema, ejecuta `npm run prisma:generate`. Para crear una nueva migración en desarrollo, usa `npm run prisma:migrate -- --name descripcion`; para instalar las migraciones existentes, usa `npm run prisma:deploy`. `npm run prisma:status` consulta el estado. No es necesario regenerar la migración inicial al clonar.

Los datos locales persisten en el volumen `pgdata`. `docker compose down` detiene el entorno sin borrar ese volumen. Si cambias `POSTGRES_PORT`, actualiza también el puerto de `DATABASE_URL` en tu `.env`. No versiones ese archivo.

Para levantar la base de datos y la API en contenedores:

```bash
docker compose --profile full up -d --build
```

La imagen (`Dockerfile` multi-stage sobre `node:22-alpine`) compila en una etapa y en la final deja solo `dist/`, las dependencias de producción, el esquema y las migraciones. Corre como el usuario `node` y escucha en `PORT` (3000). Al arrancar, `docker-entrypoint.sh` ejecuta `prisma migrate deploy` y luego la API, así que la base del ambiente queda migrada en cada despliegue; por eso `prisma` y `dotenv` están en `dependencies`.

Pruebas:

```bash
npm test          # pruebas unitarias
npm run test:cov  # cobertura
npm run test:e2e  # HTTP, validación y Prisma; requiere PostgreSQL y migraciones
npm run lint      # revisión con ESLint, sin modificar archivos
npm run format    # formato de src/ y test/ con Prettier
npm run build     # compila en dist/
```

Después de compilar, `npm run start:prod` ejecuta `dist/main.js`.

El `override` de Multer en `package.json` mantiene la dependencia transitiva de `@nestjs/platform-express` en la versión corregida `2.5.x` o posterior dentro de la versión mayor 2 (GHSA-q7qp-rjg7-q26m).

### Usuarios y autenticación (issue #4)

| Método y ruta | Acceso | Resultado |
|---------------|--------|-----------|
| `POST /usuarios` | Público | Registra un ESTUDIANTE; devuelve el perfil sin contraseña (201). |
| `POST /login` | Público | Devuelve `{ "access_token": "..." }` (200). |
| `GET /usuarios` | ADMIN | Lista perfiles sin hashes (200). |
| `GET /usuarios/:id` | ADMIN o el propio usuario | Consulta un perfil (200). |
| `PATCH /usuarios/:id` | ADMIN o el propio usuario | Actualiza el perfil (200); solo ADMIN puede cambiar `rol`. |
| `DELETE /usuarios/:id` | ADMIN | Elimina el usuario (204, sin cuerpo). |

El registro recibe `nombre`, `correo` y `contrasena`. El login recibe `correo` y `contrasena`. `PATCH` acepta cualquiera de esos campos y `rol` (`ESTUDIANTE`, `DOCENTE`, `ADMIN`), sujeto a los permisos anteriores. Nombre y correo se recortan; el correo se normaliza a minúsculas. La contraseña requiere al menos 8 caracteres y como máximo 72 bytes UTF-8 (límite de bcrypt); se almacena con bcrypt, costo 12. Nunca se devuelve la contraseña ni su hash.

Ejemplo de registro:

```json
{
  "nombre": "Estudiante de ejemplo",
  "correo": "estudiante@example.com",
  "contrasena": "UnaClaveDeEjemplo123!"
}
```

Envía el token como `Authorization: Bearer <access_token>`. El JWT incluye `sub` (id del usuario), `rol`, `iat` y `exp`; se firma con HS256 usando `JWT_SECRET` y vence según `JWT_EXPIRES_IN` (por defecto `1h`). Configura un secreto propio en `.env` antes de usar autenticación; el valor de `.env.example` es solo un marcador. Si falta `JWT_SECRET`, la aplicación no arranca.

Los guards consultan el usuario y su rol vigente en la base de datos: un usuario eliminado pierde acceso y un cambio de rol se aplica aunque el token aún conserve el rol anterior. Cambiar la contraseña no revoca tokens ya emitidos; estos conservan su expiración. El registro público ignora el campo `rol` y siempre crea estudiantes. El seed del issue #22 permite crear el administrador inicial con credenciales propias, sin cuentas ni contraseñas predeterminadas.

Errores previstos: `400` para DTOs o ids no enteros inválidos, `401` para credenciales o tokens inválidos/expirados, `403` para falta de permisos, `404` para usuarios no encontrados y `409` para correo duplicado. Los campos ajenos al DTO se eliminan mediante `whitelist`.

Las pruebas unitarias de `AuthService` usan bcrypt real y dobles de Prisma/JWT. Las pruebas e2e usan PostgreSQL y crean usuarios con correos únicos; al terminar eliminan únicamente sus propios usuarios. Para ejecutarlas en una base dedicada, define `DATABASE_URL`, aplica `npm run prisma:deploy` y ejecuta `npm run test:e2e -- --runInBand`. Incluyen registro, login, DTOs, permisos, cambios de contraseña, degradación de roles y tokens de usuarios eliminados.

### Espacios y disponibilidad (issue #5)

| Método y ruta | Acceso | Resultado |
|---------------|--------|-----------|
| `GET /espacios?tipo=CUBICULO` | Público | Lista espacios activos; `tipo` es opcional (200). |
| `GET /espacios/:id` | Público | Consulta un espacio activo (200). |
| `POST /espacios` | ADMIN | Crea un espacio (201). |
| `PUT /espacios/:id` | ADMIN | Actualiza un espacio, incluso para reactivarlo (200). |
| `DELETE /espacios/:id` | ADMIN | Elimina sin reservas o desactiva si tiene cualquier reserva (200). |
| `GET /espacios/:id/disponibilidad?fecha=YYYY-MM-DD` | Público | Devuelve los intervalos libres de esa fecha (200). |

POST y PUT reciben `nombre`, `tipo`, `capacidad` (entero positivo), `ubicacion` y opcionalmente `activo` (booleano). PUT requiere todos los campos obligatorios; `tipo` se normaliza a mayúsculas. Los nombres duplicados reciben `409`, los datos inválidos `400`, y los ids inexistentes `404`. Los espacios inactivos tampoco se exponen por las consultas públicas.

DELETE devuelve `{ "id": 1, "accion": "eliminado" }` si no hay reservas. Si existe cualquier reserva, incluida una cancelada o finalizada, conserva el espacio y el historial, establece `activo=false` y devuelve `accion: "desactivado"`. La clave foránea evita borrar un espacio si una reserva se inserta concurrentemente; en ese caso también se desactiva.

La disponibilidad interpreta `fecha` en `ESPACIOS_ZONA_HORARIA` (por defecto `America/Mexico_City`), con horario diario `ESPACIOS_HORA_APERTURA=07:00` y `ESPACIOS_HORA_CIERRE=21:00`. Los horarios usan `HH:mm`, apertura anterior al cierre y no cruzan medianoche. La zona debe ser IANA válida; una configuración inválida impide el arranque. Una fecha imposible o un límite horario inexistente/ambiguo por cambios de horario recibe `400`.

Ejemplo sin reservas:

```json
{
  "espacioId": 1,
  "fecha": "2026-11-10",
  "zonaHoraria": "America/Mexico_City",
  "horario": {
    "inicio": "2026-11-10T07:00:00.000-06:00",
    "fin": "2026-11-10T21:00:00.000-06:00"
  },
  "bloquesLibres": [
    { "inicio": "2026-11-10T07:00:00.000-06:00", "fin": "2026-11-10T21:00:00.000-06:00" }
  ]
}
```

Los bloques son intervalos continuos máximos `[inicio, fin)`, sin duración fija, expresados en ISO 8601 con offset. Se descuentan solo reservas ACTIVAS que se traslapen con el horario; las contiguas/superpuestas se unen y se recortan a los límites. Si está totalmente ocupado, `bloquesLibres` es `[]`. La respuesta no expone usuarios ni detalles de reservas. La creación y actualización de reservas revalidan la disponibilidad dentro de una transacción.

Las variables nuevas están en `.env.example` y se propagan al servicio API de Compose. Las pruebas unitarias cubren intervalos, fechas, zonas y cambios de horario; las pruebas HTTP cubren filtros, permisos, validación, reservas canceladas/finalizadas y desactivación con historial.

### Reservas y traslapes (issue #6)

Todas las rutas requieren `Authorization: Bearer <access_token>`.

| Método y ruta | Comportamiento |
|---------------|----------------|
| `POST /reservas` | Crea una reserva ACTIVA del usuario autenticado (201). |
| `GET /reservas` | Lista las reservas propias, de cualquier estado; ADMIN ve todas (200). |
| `PUT /reservas/:id` | Modifica una reserva ACTIVA del propio usuario o de cualquier usuario si es ADMIN (200). |
| `DELETE /reservas/:id` | Marca como CANCELADA, conserva el registro y devuelve la reserva (200). Solo propietario o ADMIN. |

POST y PUT reciben el mismo cuerpo completo:

```json
{
  "espacioId": 1,
  "inicio": "2026-11-10T09:00:00-06:00",
  "fin": "2026-11-10T10:00:00-06:00"
}
```

Los instantes deben ser ISO 8601 con `Z` u offset explícito, con precisión máxima de milisegundos e `inicio < fin`. Las respuestas expresan los instantes en UTC (`Z`). El propietario se toma del JWT: los campos `usuarioId` y `estado` enviados por el cliente se eliminan por `whitelist`. PUT requiere `espacioId`, `inicio` y `fin`; permite mover una reserva a otro espacio activo y conserva el propietario y el estado.

Hay traslape si existe una reserva ACTIVA del mismo espacio con `existente.inicio < nuevoFin AND existente.fin > nuevoInicio`. Las reservas contiguas se permiten. PUT excluye la propia reserva al validar. Un conflicto devuelve `409`; también se rechaza con `409` la modificación de una CANCELADA o FINALIZADA. DELETE puede repetirse y conserva el estado CANCELADA; las reservas canceladas/finalizadas no bloquean nuevos intervalos.

Crear o modificar bloquea la fila del espacio mediante `FOR NO KEY UPDATE`, comprueba que siga activo y valida el traslape antes de escribir, todo dentro de una transacción `READ COMMITTED`. Las modificaciones y cancelaciones también bloquean la reserva. Los bloqueos de PostgreSQL se comparten entre instancias y se liberan al confirmar o revertir. Las futuras escrituras de reservas deben respetar este protocolo para conservar la garantía frente a solicitudes simultáneas.

Errores previstos: `400` para DTOs, fechas, intervalos, ids inválidos o espacio inactivo; `401` sin autenticación válida; `403` al modificar/cancelar reservas ajenas; `404` para reserva o espacio inexistente; `409` para traslapes o modificación de una reserva no ACTIVA. Esta etapa valida intervalo, espacio activo y traslape; el horario del issue #5 determina la ventana mostrada por disponibilidad.

Las pruebas incluyen reservas contiguas, traslapes parciales/contenidos/envolventes, exclusión de la propia reserva, permisos, cambios de espacio y cancelación sin borrado. Las pruebas de concurrencia levantan dos instancias de NestJS conectadas a PostgreSQL: creación/creación, actualización/creación, actualización/actualización y cancelación/actualización.

### Pruebas unitarias y reportes (issue #7)

Las pruebas `src/**/*.spec.ts` usan Prisma simulado y no requieren PostgreSQL, Docker ni migraciones aplicadas. En `PrismaService` se reemplazan los métodos de conexión/desconexión para probar el ciclo de vida y la propagación de errores sin abrir conexiones. Los casos de reservas simulan los resultados de Prisma y verifican los filtros estrictos de traslape, estado ACTIVA, espacio y exclusión de la propia reserva; la ejecución real del SQL y la concurrencia se comprueban en las pruebas e2e.

```bash
npm test -- --runInBand
npm run test:cov -- --runInBand
```

`npm test` genera el reporte JUnit. `npm run test:cov` también mide cobertura y falla si cualquiera de los siete servicios queda por debajo del 70 % en líneas, sentencias, funciones o ramas. Los umbrales de `coverageThreshold` están definidos individualmente para AppService, AuthService, EspaciosService, HealthService, PrismaService, ReservasService y UsuariosService; al agregar otro servicio, agrega su entrada al umbral. La cobertura global incluye controladores, módulos y DTOs, y se informa por separado del requisito de servicios.

Reportes disponibles para publicar como artefactos del pipeline:

| Archivo | Contenido |
|---------|-----------|
| `test-results/junit.xml` | Resultados unitarios compatibles con JUnit, generados por `jest-junit`. |
| `coverage/lcov.info` | Cobertura en formato LCOV. |
| `coverage/lcov-report/index.html` | Informe HTML navegable. |
| `coverage/coverage-final.json` | Detalle de cobertura para herramientas. |

`test-results/` y `coverage/` están excluidos de Git. Los reportes se sobrescriben en cada ejecución unitaria. Las pruebas e2e conservan su configuración separada y requieren PostgreSQL con las migraciones aplicadas. La publicación en CI corresponde al issue #9.

### Documentación interactiva (issue #8)

Con PostgreSQL levantado, las migraciones aplicadas y la API ejecutándose:

- Swagger UI: `http://localhost:3000/api/docs`
- Documento OpenAPI JSON: `http://localhost:3000/api/docs-json`
- Documento OpenAPI YAML: `http://localhost:3000/api/docs-yaml`

Si cambias `PORT`, usa ese puerto en las URLs. Los endpoints se agrupan en `auth`, `usuarios`, `espacios` y `reservas`; `sistema` contiene la respuesta base `GET /`. Cada operación muestra su acceso, DTOs con ejemplos, respuestas y errores esperados. Los modelos de respuesta de usuarios omiten contraseñas y hashes; las contraseñas de entrada están marcadas como `writeOnly`.

Para probar una ruta protegida:

1. Registra un usuario con `POST /usuarios` si aún no tienes una cuenta.
2. Ejecuta `POST /login` y copia el valor de `access_token`.
3. Pulsa **Authorize**, pega únicamente el token (sin escribir `Bearer`) y confirma.
4. Usa **Try it out** y **Execute** en la operación que quieras probar. Las escrituras ejecutan cambios reales en la base del ambiente abierto.

El token solo habilita los permisos de esa cuenta; las operaciones de ADMIN requieren una cuenta con ese rol. El administrador inicial corresponde al seed del issue #22. La documentación es pública y los guards de las rutas protegidas siguen verificando autenticación y permisos.

`test/swagger.e2e-spec.ts` verifica UI, recursos JSON/YAML, tags, seguridad Bearer, parámetros, campos requeridos/opcionales y respuestas sin hashes. Esta suite reemplaza Prisma y puede ejecutarse sin PostgreSQL con `npm run test:e2e -- --runInBand swagger.e2e-spec.ts`. La suite e2e completa requiere PostgreSQL.

### Datos de ejemplo y administrador (issue #22)

El comando de seed crea seis espacios de ejemplo y un administrador con las credenciales que configures. Antes de ejecutarlo, configura `DATABASE_URL` para la base de destino y completa en tu `.env` privado:

| Variable | Requisito |
|----------|-----------|
| `SEED_ADMIN_CORREO` | Obligatorio; correo válido, normalizado a minúsculas. |
| `SEED_ADMIN_CONTRASENA` | Obligatoria; mínimo 8 caracteres y máximo 72 bytes UTF-8. |
| `SEED_ADMIN_NOMBRE` | Opcional; por defecto `Administrador`, entre 1 y 100 caracteres. |

```bash
docker compose up -d --wait db
npm run prisma:deploy
npx prisma db seed
# Alternativa equivalente:
npm run prisma:seed
```

En PowerShell puedes usar `npx.cmd prisma db seed` o `npm.cmd run prisma:seed`. El seed se ejecuta explícitamente; instalar dependencias y aplicar migraciones no lo ejecuta. Usa el cliente generado por `npm ci` y `ts-node`, ya disponible en las dependencias de desarrollo.

| Espacio de ejemplo | Tipo | Capacidad |
|--------------------|------|-----------|
| Cubículo Biblioteca 1 | CUBICULO | 4 |
| Cubículo Biblioteca 2 | CUBICULO | 6 |
| Laboratorio de Cómputo 1 | LABORATORIO | 30 |
| Laboratorio de Cómputo 2 | LABORATORIO | 24 |
| Cancha de Fútbol | CANCHA | 22 |
| Cancha de Básquetbol | CANCHA | 10 |

Estos nombres y ubicaciones son datos de ejemplo para desarrollo. El script usa `upsert` por nombre de espacio y correo del administrador, dentro de una transacción. Ejecutarlo varias veces conserva ids, contraseñas y cambios existentes en los registros; tampoco reactiva espacios desactivados. Si necesitas cambiar una contraseña existente, usa `PATCH /usuarios/:id`. Cambiar `SEED_ADMIN_CORREO` identifica otra cuenta.

Si el correo ya pertenece a un usuario sin rol ADMIN, el seed falla y revierte la transacción; no cambia su rol. Las variables ausentes o inválidas se rechazan antes de escribir. La contraseña nueva se guarda con bcrypt (costo 12) y el script no muestra contraseñas, hashes ni cadenas de conexión. Los valores de las credenciales solo deben estar en variables de entorno o `.env`, excluido de Git.

### Salud y CORS por ambiente (issue #23)

`GET /health` es público y ejecuta `SELECT 1` en PostgreSQL en cada llamada. Con la base disponible devuelve HTTP 200:

```json
{
  "status": "ok",
  "version": "0123456789abcdef0123456789abcdef01234567",
  "database": "up"
}
```

Si la consulta falla, devuelve HTTP 503 con `status: "error"` y `database: "down"`, conservando `version`. No expone errores de Prisma, cadenas de conexión ni credenciales. Las respuestas llevan `Cache-Control: no-store`. El arranque de la API continúa exigiendo la conexión inicial de Prisma; el 503 informa fallos de la consulta una vez que la aplicación está ejecutándose.

Configura `COMMIT_SHA` con el SHA real de la versión desplegada. El pipeline debe inyectar su commit (`github.sha`) al contenedor o App Settings; en desarrollo, si falta o está vacío, se informa `development`. No se ejecuta Git dentro de la imagen para obtener el valor.

`CORS_ORIGINS` contiene los orígenes del frontend permitidos, separados por comas. Ejemplo local:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
COMMIT_SHA=development
```

En Dev/Prod usa únicamente los orígenes HTTP(S) del frontend de cada ambiente. Se recortan espacios, se normalizan puerto/host y una barra final y se eliminan duplicados. No se aceptan comodines, rutas, query strings, fragmentos ni credenciales; una configuración inválida impide el arranque. Si la lista está vacía, se rechazan las solicitudes con `Origin` y se permiten clientes sin ese encabezado, como los smoke tests del pipeline.

Los orígenes ajenos reciben 403, incluidos sus preflight, sin `Access-Control-Allow-Origin`. Los permitidos reciben su origen exacto y pueden usar `Content-Type` y `Authorization`, con métodos GET, HEAD, POST, PUT, PATCH, DELETE y OPTIONS. Los preflight aceptados devuelven 204. CORS usa JWT en el encabezado Authorization y no habilita cookies cross-origin; los guards y permisos continúan aplicándose. Los clientes sin Origin siguen necesitando JWT en las rutas protegidas.

Las dos variables están en `.env.example` y se propagan al servicio API de Compose. La documentación de `/health` está en Swagger, tag `sistema`. Las pruebas cubren 200/503, versión, errores sanitizados, orígenes exactos, rechazos, preflight y conservación del guard JWT; la suite HTTP completa también consulta PostgreSQL real.

### Application Insights (issue #56)

La API conserva Node **20.19+**. Se fija `@azure/monitor-opentelemetry` en **1.18.0** y se fijan dependencias transitivas mediante `overrides`: las versiones actuales de Azure requieren Node 22. No actualices estos paquetes sin repetir la comprobación de Node 20 y la auditoría. Algunas dependencias OpenTelemetry se actualizan explícitamente para corregir avisos de seguridad. El requisito de Node del proyecto y la imagen prevista en el issue #3 se conservan.

`main.ts` carga `.env`, inicializa la telemetría y después importa el arranque de Nest. Así el SDK instrumenta HTTP y el driver `pg` utilizado por Prisma antes de que se carguen. Al cerrar Nest se vacía y cierra el SDK. Si `APPLICATIONINSIGHTS_CONNECTION_STRING` está ausente, vacía o solo contiene espacios, no se carga Azure Monitor ni se crea un exportador.

Configura estas App Settings en cada ambiente, o en `.env` para una prueba voluntaria:

| Variable | Dev | Prod |
|----------|-----|------|
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Connection String del recurso de Dev | Connection String del recurso de Prod |
| `OTEL_SERVICE_NAME` | `api-dev` | `api-prod` |
| `COMMIT_SHA` | SHA desplegado | SHA desplegado |

La cadena se obtiene del recurso **Application Insights → Overview → Connection String**, creado por infraestructura; no es una credencial del seed. No la subas a Git. Con telemetría habilitada, un rol distinto de `api-dev` o `api-prod` impide el arranque para evitar mezclar ambientes. El rol se configura explícitamente porque ambos contenedores pueden usar `NODE_ENV=production`. Evita un segundo agente automático de Application Insights sobre este SDK para no duplicar eventos.

Se capturan requests HTTP y dependencias PostgreSQL, con muestreo del 100% para las evidencias del proyecto. No se habilitan Live Metrics, el snippet del navegador ni los adaptadores de logs Bunyan/Winston. Los parámetros SQL no se incluyen; no concatenes datos personales o secretos en consultas SQL. La instrumentación `pg` corregida usa atributos nuevos y un hook agrega los atributos de compatibilidad que el exportador Node 20 necesita para identificar `postgresql` y su destino en Application Map. Las trazas de negocio corresponden al issue #57.

**Verificación local reproducible:** usa una base temporal PostgreSQL, establece `DATABASE_URL` con su URL, aplica `npm run prisma:deploy`, ejecuta `npm run build` y después `npm run test:telemetry`. El script inicia un colector local, usa una clave ficticia, deshabilita Statsbeat y verifica ambos roles, la request `/health`, la dependencia PostgreSQL y su identificador de operación compartido. No utiliza la cadena real ni envía datos a Azure. Para comprobar específicamente Node 20:

```sh
npx --yes --package=node@20.19.5 node test/telemetry-smoke.cjs
```

La comprobación local pasó con Node 20.19.5 y 24.16.0; `npm audit --omit=dev` no reportó vulnerabilidades al implementar este issue. La dependencia de desarrollo existente `@prisma/streams-local` declara Node 22: no forma parte del runtime de la API ni se usa en estas pruebas; queda fuera de los cambios de telemetría.

**Evidencia pendiente en Azure:** desplegar con las variables de su ambiente, llamar varias veces `GET /health` y esperar la ingestión. En Application Insights → **Application Map**, comprobar el nodo `api-dev`/`api-prod` y su dependencia PostgreSQL. En **Transaction search**, abrir una request `/health` y comprobar la dependencia correlacionada. En Logs puede consultarse:

```kusto
requests
| where timestamp > ago(30m)
| where cloud_RoleName in ("api-dev", "api-prod")
| project timestamp, name, cloud_RoleName, operation_Id
| join kind=inner (
    dependencies
    | where timestamp > ago(30m) and type == "postgresql"
    | project operation_Id, dependencyName=name, target
) on operation_Id
```

Guardar capturas de ambos ambientes como evidencia del issue. El colector local valida los envelopes exportados, pero la aparición en el portal solo queda confirmada después de esa verificación con los recursos desplegados. Referencia: [configuración del SDK de Azure Monitor](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/monitor/monitor-opentelemetry).

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

Flujo: `feature/*` → PR a `develop` (CI) → PR de `develop` a `main` (CI) → merge → CD: Dev → aprobación → Prod.

`main` y `develop` están protegidas: no se permiten commits directos y todo PR necesita 1 aprobación. `develop` es la rama por defecto de ambos repos, así que el issue se cierra al fusionar el PR ahí.

Cada PR referencia su issue. Todos los issues viven en este repo, así que un PR de aquí usa `Closes #n` y uno de `sistema-reservas-web` usa `Closes Andy-752109/sistema-reservas-api#n`.

## Gestión del trabajo

El backlog se gestiona en **GitHub Projects** (tablero *“Sistema de Reservas - Tablero de Trabajo”*) con una jerarquía **Épica → Historia de usuario → Tarea** usando sub-issues:

- Etiquetas de tipo: `epic`, `story`, `task`.
- Etiquetas de área: `backend`, `frontend`, `database`, `infra`, `devops`, `testing`, `observability`, `documentation`.
- Milestones por fase: Fundación → Desarrollo de dominio → Infraestructura y CI/CD → Observabilidad y presentación.
- Columnas del tablero: Backlog → Ready → In Progress → In Review → Done.
- Etiquetas de rol: `rol:backend`, `rol:frontend`, `rol:devops`.
- Etiquetas de tamaño: `size:S` (1 punto), `size:M` (2 puntos), `size:L` (3 puntos).

### Roles y reparto

Los roles indican quién responde por cada área; la documentación se reparte para que la carga quede pareja.

| Rol | Responsable | Área | Revisa los PR de | Tareas | Puntos |
|-----|-------------|------|------------------|--------|--------|
| Backend | Ramiro | API, base de datos y pruebas | Frontend | 14 | 26 |
| Frontend | Ale | Aplicación web, CI del web, Wiki de deployment y tablero | DevOps e infra | 14 | 26 |
| DevOps e infra | Andy | Docker y despliegue de API y web, CI/CD y Terraform | Backend | 15 | 28 |

Los puntos son una estimación inicial y cuentan una tarea opcional de Frontend (#58, 2 puntos). Al terminar cada fase, el equipo compara los puntos y mueve tareas si alguien va más cargado.

**Ajuste del 11 nov 2026:** Andy toma el Dockerfile (#32) y el CD (#53) del web, que siguen el mismo patrón que los de la API; Ale toma la Wiki de deployment (#19) y el tablero (#65) y se concentra en las pantallas.
