import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EspaciosService } from '../src/espacios/espacios.service';
import { EstadoReserva, Rol } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';

interface EspacioView {
  id: number;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  activo: boolean;
}
interface DisponibilidadView {
  espacioId: number;
  fecha: string;
  zonaHoraria: string;
  bloquesLibres: { inicio: string; fin: string }[];
}

describe('Espacios (e2e con PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let userId: number;
  const userIds: number[] = [];
  const spaceIds: number[] = [];
  const prefix = randomUUID();
  const password = 'ClaveDePrueba123!';
  const api = () => request(app.getHttpServer());
  const dto = (name: string) => ({
    nombre: `${prefix}-${name}`,
    tipo: ' cubiculo ',
    capacidad: 4,
    ubicacion: ' Biblioteca ',
  });

  async function crear(name: string): Promise<EspacioView> {
    const response = await api()
      .post('/espacios')
      .auth(adminToken, { type: 'bearer' })
      .send(dto(name))
      .expect(201);
    const body = response.body as EspacioView;
    spaceIds.push(body.id);
    return body;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EspaciosService)
      .useFactory({
        inject: [PrismaService],
        factory: (db: PrismaService) => {
          const values: Record<string, string> = {
            ESPACIOS_HORA_APERTURA: '07:00',
            ESPACIOS_HORA_CIERRE: '21:00',
            ESPACIOS_ZONA_HORARIA: 'America/Mexico_City',
          };
          const config = {
            get: (key: string, fallback: string) => values[key] ?? fallback,
          };
          return new EspaciosService(db, config as unknown as ConfigService);
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    const hash = await bcrypt.hash(password, 10);
    for (const rol of [Rol.ADMIN, Rol.ESTUDIANTE]) {
      const user = await prisma.usuario.create({
        data: {
          nombre: 'Prueba espacios',
          correo: `${prefix}-${rol.toLowerCase()}@example.com`,
          contrasena: hash,
          rol,
        },
      });
      userIds.push(user.id);
      const response = await api()
        .post('/login')
        .send({ correo: user.correo, contrasena: password })
        .expect(200);
      const token = (response.body as { access_token: string }).access_token;
      if (rol === Rol.ADMIN) adminToken = token;
      else {
        userToken = token;
        userId = user.id;
      }
    }
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.reserva.deleteMany({
          where: { espacioId: { in: spaceIds } },
        });
        await prisma.espacio.deleteMany({ where: { id: { in: spaceIds } } });
        await prisma.usuario.deleteMany({ where: { id: { in: userIds } } });
      }
    } finally {
      if (app) await app.close();
    }
  });

  it('permite a ADMIN crear, consultar y actualizar espacios', async () => {
    const space = await crear('crud');
    expect(space.tipo).toBe('CUBICULO');
    expect(space.ubicacion).toBe('Biblioteca');
    expect(space.activo).toBe(true);
    await api().get(`/espacios/${space.id}`).expect(200);
    const response = await api()
      .put(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ ...dto('crud'), capacidad: 8 })
      .expect(200);
    expect((response.body as EspacioView).capacidad).toBe(8);
  });

  it('lista solo espacios activos y permite filtrar por tipo', async () => {
    const active = await crear('activo');
    const inactive = await crear('inactivo');
    const lab = await crear('laboratorio');
    await prisma.espacio.update({
      where: { id: inactive.id },
      data: { activo: false },
    });
    await prisma.espacio.update({
      where: { id: lab.id },
      data: { tipo: 'LABORATORIO' },
    });
    const response = await api()
      .get('/espacios?tipo=%20cubiculo%20')
      .expect(200);
    const spaces = response.body as EspacioView[];
    expect(spaces.some((space) => space.id === active.id)).toBe(true);
    expect(
      spaces.every((space) => space.activo && space.tipo === 'CUBICULO'),
    ).toBe(true);
    expect(
      spaces.some((space) => space.id === inactive.id || space.id === lab.id),
    ).toBe(false);
    await api().get(`/espacios/${inactive.id}`).expect(404);
    const all = await api().get('/espacios').expect(200);
    expect((all.body as EspacioView[]).every((space) => space.activo)).toBe(
      true,
    );
    expect(
      (all.body as EspacioView[]).some((space) => space.id === lab.id),
    ).toBe(true);
  });

  it('protege las escrituras con JWT y rol ADMIN', async () => {
    const space = await crear('permisos');
    await api().post('/espacios').send(dto('no-autenticado')).expect(401);
    await api()
      .put(`/espacios/${space.id}`)
      .send(dto('no-autenticado'))
      .expect(401);
    await api().delete(`/espacios/${space.id}`).expect(401);
    await api()
      .post('/espacios')
      .auth(userToken, { type: 'bearer' })
      .send(dto('no-admin'))
      .expect(403);
    await api()
      .put(`/espacios/${space.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto('no-admin'))
      .expect(403);
    await api()
      .delete(`/espacios/${space.id}`)
      .auth(userToken, { type: 'bearer' })
      .expect(403);
  });

  it('valida DTOs, ids, fechas reales y nombres duplicados', async () => {
    const space = await crear('validaciones');
    for (const invalid of [
      { ...dto('invalido'), capacidad: 0 },
      { ...dto('invalido'), capacidad: 1.5 },
      { ...dto('invalido'), nombre: ' ' },
      { ...dto('invalido'), activo: null },
    ]) {
      await api()
        .post('/espacios')
        .auth(adminToken, { type: 'bearer' })
        .send(invalid)
        .expect(400);
    }
    await api()
      .post('/espacios')
      .auth(adminToken, { type: 'bearer' })
      .send(dto('validaciones'))
      .expect(409);
    await api()
      .put(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ capacidad: 8 })
      .expect(400);
    for (const date of [
      '',
      '2026-02-30',
      '2026-02-29',
      '2026-11-10T00:00:00Z',
    ]) {
      await api()
        .get(`/espacios/${space.id}/disponibilidad`)
        .query({ fecha: date })
        .expect(400);
    }
    await api().get(`/espacios/${space.id}/disponibilidad`).expect(400);
    await api().get('/espacios/0/disponibilidad?fecha=2026-11-10').expect(400);
    await api().get('/espacios/no-id').expect(400);
    await api().get('/espacios?tipo=').expect(400);
  });

  it('devuelve intervalos libres sin información privada e ignora reservas canceladas/finalizadas', async () => {
    const space = await crear('disponibilidad');
    const fecha = '2026-11-10';
    const at = (hora: string) =>
      DateTime.fromISO(`${fecha}T${hora}`, {
        zone: 'America/Mexico_City',
      }).toJSDate();
    await prisma.reserva.createMany({
      data: [
        {
          usuarioId: userId,
          espacioId: space.id,
          inicio: at('09:00'),
          fin: at('10:00'),
          estado: EstadoReserva.ACTIVA,
        },
        {
          usuarioId: userId,
          espacioId: space.id,
          inicio: at('10:00'),
          fin: at('11:00'),
          estado: EstadoReserva.ACTIVA,
        },
        {
          usuarioId: userId,
          espacioId: space.id,
          inicio: at('12:00'),
          fin: at('13:00'),
          estado: EstadoReserva.CANCELADA,
        },
        {
          usuarioId: userId,
          espacioId: space.id,
          inicio: at('14:00'),
          fin: at('15:00'),
          estado: EstadoReserva.FINALIZADA,
        },
      ],
    });
    const response = await api()
      .get(`/espacios/${space.id}/disponibilidad?fecha=${fecha}`)
      .expect(200);
    const body = response.body as DisponibilidadView;
    expect(body.zonaHoraria).toBe('America/Mexico_City');
    expect(body.bloquesLibres).toEqual([
      {
        inicio: `${fecha}T07:00:00.000-06:00`,
        fin: `${fecha}T09:00:00.000-06:00`,
      },
      {
        inicio: `${fecha}T11:00:00.000-06:00`,
        fin: `${fecha}T21:00:00.000-06:00`,
      },
    ]);
    expect(body).not.toHaveProperty('reservas');
    expect(body).not.toHaveProperty('usuarioId');
  });

  it('elimina físicamente un espacio sin reservas', async () => {
    const space = await crear('eliminar');
    const response = await api()
      .delete(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect(response.body).toEqual({ id: space.id, accion: 'eliminado' });
    expect(
      await prisma.espacio.findUnique({ where: { id: space.id } }),
    ).toBeNull();
    await api()
      .get(`/espacios/${space.id}/disponibilidad?fecha=2026-11-10`)
      .expect(404);
    await api()
      .delete(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
  });

  it('desactiva y conserva un espacio con reservas históricas', async () => {
    const space = await crear('historico');
    await prisma.reserva.create({
      data: {
        usuarioId: userId,
        espacioId: space.id,
        inicio: new Date('2026-01-01T15:00:00Z'),
        fin: new Date('2026-01-01T16:00:00Z'),
        estado: EstadoReserva.CANCELADA,
      },
    });
    const response = await api()
      .delete(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect(response.body).toEqual({ id: space.id, accion: 'desactivado' });
    expect(
      (await prisma.espacio.findUniqueOrThrow({ where: { id: space.id } }))
        .activo,
    ).toBe(false);
    expect(await prisma.reserva.count({ where: { espacioId: space.id } })).toBe(
      1,
    );
    await api()
      .get(`/espacios/${space.id}/disponibilidad?fecha=2026-11-10`)
      .expect(404);
    await api()
      .put(`/espacios/${space.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ ...dto('historico'), activo: true })
      .expect(200);
    await api().get(`/espacios/${space.id}`).expect(200);
  });
});
