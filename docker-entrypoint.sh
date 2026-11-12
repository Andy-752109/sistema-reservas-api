#!/bin/sh
# Aplica las migraciones pendientes y arranca la API.
# migrate deploy es idempotente y usa un lock en PostgreSQL, así que es seguro
# aunque arranquen varias instancias a la vez.
set -eu

./node_modules/.bin/prisma migrate deploy

# exec: node recibe directamente SIGTERM al detener el contenedor.
exec node dist/main.js
