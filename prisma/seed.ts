import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { isEmail } from 'class-validator';
import { PrismaClient } from '../src/generated/prisma/client';
import { Rol } from '../src/generated/prisma/enums';

class SeedError extends Error {}

const espacios = [
  {
    nombre: 'Cubículo Biblioteca 1',
    tipo: 'CUBICULO',
    capacidad: 4,
    ubicacion: 'Biblioteca, planta baja',
  },
  {
    nombre: 'Cubículo Biblioteca 2',
    tipo: 'CUBICULO',
    capacidad: 6,
    ubicacion: 'Biblioteca, primer piso',
  },
  {
    nombre: 'Laboratorio de Cómputo 1',
    tipo: 'LABORATORIO',
    capacidad: 30,
    ubicacion: 'Edificio de laboratorios, planta baja',
  },
  {
    nombre: 'Laboratorio de Cómputo 2',
    tipo: 'LABORATORIO',
    capacidad: 24,
    ubicacion: 'Edificio de laboratorios, primer piso',
  },
  {
    nombre: 'Cancha de Fútbol',
    tipo: 'CANCHA',
    capacidad: 22,
    ubicacion: 'Zona deportiva, exterior',
  },
  {
    nombre: 'Cancha de Básquetbol',
    tipo: 'CANCHA',
    capacidad: 10,
    ubicacion: 'Zona deportiva, gimnasio',
  },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  const correo = process.env.SEED_ADMIN_CORREO?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_CONTRASENA;
  const nombre = (process.env.SEED_ADMIN_NOMBRE ?? 'Administrador').trim();

  if (!connectionString)
    throw new SeedError('Define DATABASE_URL antes de ejecutar el seed.');
  if (!correo || correo.length > 254 || !isEmail(correo)) {
    throw new SeedError('Define SEED_ADMIN_CORREO con un correo válido.');
  }
  if (
    !password ||
    [...password].length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new SeedError(
      'Define SEED_ADMIN_CONTRASENA con al menos 8 caracteres y como máximo 72 bytes UTF-8.',
    );
  }
  if (!nombre || nombre.length > 100) {
    throw new SeedError(
      'SEED_ADMIN_NOMBRE debe tener entre 1 y 100 caracteres.',
    );
  }

  const contrasena = await bcrypt.hash(password, 12);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await prisma.$transaction(async (tx) => {
      const admin = await tx.usuario.upsert({
        where: { correo },
        create: { nombre, correo, contrasena, rol: Rol.ADMIN },
        update: {},
      });
      if (admin.rol !== Rol.ADMIN) {
        throw new SeedError(
          'El correo indicado pertenece a un usuario sin rol ADMIN. El seed no modifica su rol; usa un correo destinado al administrador.',
        );
      }
      for (const espacio of espacios) {
        await tx.espacio.upsert({
          where: { nombre: espacio.nombre },
          create: espacio,
          update: {},
        });
      }
    });
    console.log(
      'Seed completado: 6 espacios de ejemplo y 1 administrador disponibles. Los registros existentes se conservaron.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof SeedError
      ? error.message
      : 'No se pudo ejecutar el seed. Verifica conexión, migraciones y permisos de la base de datos.',
  );
  process.exitCode = 1;
});
