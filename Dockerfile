# syntax=docker/dockerfile:1

# ── build: dependencias completas, cliente de Prisma y compilación ──────────
FROM node:22-alpine AS build
WORKDIR /app

# El postinstall (prisma generate) necesita el esquema y prisma.config.ts.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
# El cliente generado se compila dentro de dist/; después se quitan las devDependencies.
RUN npm run build && npm prune --omit=dev

# ── runtime: solo lo necesario para ejecutar y migrar ───────────────────────
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

# Los archivos quedan de root y la app corre como "node": no puede modificarlos.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY package.json prisma.config.ts ./
COPY --chmod=755 docker-entrypoint.sh ./

USER node
# App Service enruta al puerto indicado en WEBSITES_PORT (3000 en Terraform).
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
