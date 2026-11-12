import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EstadoReserva, Rol } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';

interface ReservaView {
  id: number;
  usuarioId: number;
  espacioId: number;
  inicio: string;
  fin: string;
  estado: EstadoReserva;
}

describe('Reservas (e2e y concurrencia en PostgreSQL)', () => {
  let app: INestApplication<App>;
  let secondApp: INestApplication<App>;
  let prisma: PrismaService;
  let userId: number;
  let otherId: number;
  let userToken: string;
  let otherToken: string;
  let adminToken: string;
  const ids: number[] = [];
  const spaceIds: number[] = [];
  const prefix = randomUUID();
  const api = () => request(app.getHttpServer());
  const dto = (espacioId: number, inicio = '09:00', fin = '10:00') => ({
    espacioId,
    inicio: `2026-11-10T${inicio}:00-06:00`,
    fin: `2026-11-10T${fin}:00-06:00`,
  });

  async function espacio(activo = true): Promise<number> {
    const row = await prisma.espacio.create({
      data: {
        nombre: `${prefix}-${spaceIds.length}`,
        tipo: 'CUBICULO',
        capacidad: 4,
        ubicacion: 'Prueba reservas',
        activo,
      },
    });
    spaceIds.push(row.id);
    return row.id;
  }

  async function reservar(
    espacioId: number,
    inicio = '09:00',
    fin = '10:00',
    token = userToken,
  ): Promise<ReservaView> {
    const response = await api()
      .post('/reservas')
      .auth(token, { type: 'bearer' })
      .send(dto(espacioId, inicio, fin))
      .expect(201);
    return response.body as ReservaView;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    const otherModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    secondApp = otherModule.createNestApplication();
    await secondApp.init();
    prisma = app.get(PrismaService);
    const password = 'ClavePruebaReservas123!';
    const hash = await bcrypt.hash(password, 10);
    for (const [name, rol] of [
      ['usuario', Rol.ESTUDIANTE],
      ['otro', Rol.DOCENTE],
      ['admin', Rol.ADMIN],
    ] as const) {
      const usuario = await prisma.usuario.create({
        data: {
          nombre: name,
          correo: `${prefix}-${name}@example.com`,
          contrasena: hash,
          rol,
        },
      });
      ids.push(usuario.id);
      const response = await api()
        .post('/login')
        .send({ correo: usuario.correo, contrasena: password })
        .expect(200);
      const token = (response.body as { access_token: string }).access_token;
      if (name === 'usuario') {
        userId = usuario.id;
        userToken = token;
      } else if (name === 'otro') {
        otherId = usuario.id;
        otherToken = token;
      } else adminToken = token;
    }
  }, 15000);

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.reserva.deleteMany({
          where: { espacioId: { in: spaceIds } },
        });
        await prisma.espacio.deleteMany({ where: { id: { in: spaceIds } } });
        await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
      }
    } finally {
      if (secondApp) await secondApp.close();
      if (app) await app.close();
    }
  });

  it('deriva el propietario del JWT e ignora usuarioId y estado enviados', async () => {
    const id = await espacio();
    const response = await api()
      .post('/reservas')
      .auth(userToken, { type: 'bearer' })
      .send({ ...dto(id), usuarioId: otherId, estado: EstadoReserva.CANCELADA })
      .expect(201);
    const body = response.body as ReservaView;
    expect(body.usuarioId).toBe(userId);
    expect(body.estado).toBe(EstadoReserva.ACTIVA);
    expect(body.inicio).toBe('2026-11-10T15:00:00.000Z');
  });

  it('protege todas las rutas con autenticación', async () => {
    const id = await espacio();
    await api().get('/reservas').expect(401);
    await api().post('/reservas').send(dto(id)).expect(401);
    await api().put('/reservas/1').send(dto(id)).expect(401);
    await api().delete('/reservas/1').expect(401);
  });

  it('valida fechas reales, zona explícita, inicio anterior a fin y espacio activo', async () => {
    const id = await espacio();
    for (const body of [
      dto(id, '10:00', '09:00'),
      dto(id, '10:00', '10:00'),
      { ...dto(id), inicio: '2026-02-30T09:00:00-06:00' },
      { ...dto(id), inicio: '2026-11-10T09:00:00' },
      { ...dto(id), inicio: '2026-11-10' },
      { ...dto(id), inicio: null },
      { ...dto(id), espacioId: 0 },
      {
        ...dto(id),
        inicio: '2026-11-10T10:00:00-06:00',
        fin: '2026-11-10T15:00:00Z',
      },
    ]) {
      await api()
        .post('/reservas')
        .auth(userToken, { type: 'bearer' })
        .send(body)
        .expect(400);
    }
    const inactive = await espacio(false);
    await api()
      .post('/reservas')
      .auth(userToken, { type: 'bearer' })
      .send(dto(inactive))
      .expect(400);
    const removed = await espacio();
    await prisma.espacio.delete({ where: { id: removed } });
    await api()
      .post('/reservas')
      .auth(userToken, { type: 'bearer' })
      .send(dto(removed))
      .expect(404);
  });

  it('rechaza intervalos iguales, parciales, contenidos o envolventes con 409', async () => {
    const id = await espacio();
    await reservar(id, '10:00', '12:00');
    for (const [inicio, fin] of [
      ['10:00', '12:00'],
      ['09:00', '11:00'],
      ['11:00', '13:00'],
      ['10:30', '11:00'],
      ['09:00', '13:00'],
    ]) {
      await api()
        .post('/reservas')
        .auth(otherToken, { type: 'bearer' })
        .send(dto(id, inicio, fin))
        .expect(409);
    }
  });

  it('acepta reservas contiguas y el mismo horario en otro espacio', async () => {
    const id = await espacio();
    await reservar(id, '10:00', '11:00');
    await reservar(id, '09:00', '10:00');
    await reservar(id, '11:00', '12:00');
    await reservar(await espacio(), '10:00', '11:00');
  });

  it('lista solo las reservas propias y permite a ADMIN ver todas', async () => {
    const first = await reservar(await espacio());
    const other = await reservar(await espacio(), '09:00', '10:00', otherToken);
    const own = await api()
      .get('/reservas')
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    const ownRows = own.body as ReservaView[];
    expect(ownRows.some((row) => row.id === first.id)).toBe(true);
    expect(ownRows.every((row) => row.usuarioId === userId)).toBe(true);
    const all = await api()
      .get('/reservas')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect((all.body as ReservaView[]).some((row) => row.id === other.id)).toBe(
      true,
    );
    expect((all.body as ReservaView[]).some((row) => row.id === first.id)).toBe(
      true,
    );
    for (const row of all.body as ReservaView[]) {
      expect(row).not.toHaveProperty('contrasena');
    }
  });

  it('permite actualizar sin chocar consigo misma y rechaza nuevos traslapes', async () => {
    const id = await espacio();
    const row = await reservar(id, '09:00', '10:00');
    await reservar(id, '11:00', '12:00');
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id))
      .expect(200);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id, '10:00', '11:00'))
      .expect(200);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id, '10:30', '11:30'))
      .expect(409);
    expect(
      (
        await prisma.reserva.findUniqueOrThrow({ where: { id: row.id } })
      ).inicio.toISOString(),
    ).toBe('2026-11-10T16:00:00.000Z');
    const inactive = await espacio(false);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(inactive))
      .expect(400);
  });

  it('solo permite al propietario o ADMIN modificar y cancelar', async () => {
    const id = await espacio();
    const row = await reservar(id);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(otherToken, { type: 'bearer' })
      .send(dto(id, '10:00', '11:00'))
      .expect(403);
    await api()
      .delete(`/reservas/${row.id}`)
      .auth(otherToken, { type: 'bearer' })
      .expect(403);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send(dto(id, '10:00', '11:00'))
      .expect(200);
    const cancelled = await api()
      .delete(`/reservas/${row.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    expect((cancelled.body as ReservaView).estado).toBe(
      EstadoReserva.CANCELADA,
    );
  });

  it('cancela sin borrar, permite repetir la cancelación y libera disponibilidad', async () => {
    const id = await espacio();
    const row = await reservar(id);
    await api()
      .delete(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    await api()
      .delete(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .expect(200);
    expect(
      (await prisma.reserva.findUniqueOrThrow({ where: { id: row.id } }))
        .estado,
    ).toBe(EstadoReserva.CANCELADA);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id))
      .expect(409);
    await reservar(id);
  });

  it('ignora reservas finalizadas al validar un nuevo traslape', async () => {
    const id = await espacio();
    const row = await reservar(id);
    await prisma.reserva.update({
      where: { id: row.id },
      data: { estado: EstadoReserva.FINALIZADA },
    });
    await reservar(id);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id))
      .expect(409);
  });

  it('detecta traslapes al mover una reserva a otro espacio', async () => {
    const first = await espacio();
    const target = await espacio();
    const row = await reservar(first);
    await reservar(target);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(target))
      .expect(409);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(target, '10:00', '11:00'))
      .expect(200);
  });

  it('devuelve 404 para reservas inexistentes y 400 para ids inválidos', async () => {
    const id = await espacio();
    const row = await reservar(id);
    await prisma.reserva.delete({ where: { id: row.id } });
    await api()
      .delete(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .expect(404);
    await api()
      .put(`/reservas/${row.id}`)
      .auth(userToken, { type: 'bearer' })
      .send(dto(id))
      .expect(404);
    await api()
      .delete('/reservas/0')
      .auth(userToken, { type: 'bearer' })
      .expect(400);
    await api()
      .put('/reservas/no-id')
      .auth(userToken, { type: 'bearer' })
      .send(dto(id))
      .expect(400);
  });

  it('acepta solo una creación simultánea para el mismo horario entre dos instancias', async () => {
    const id = await espacio();
    const responses = await Promise.all([
      api().post('/reservas').auth(userToken, { type: 'bearer' }).send(dto(id)),
      request(secondApp.getHttpServer())
        .post('/reservas')
        .auth(otherToken, { type: 'bearer' })
        .send(dto(id)),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      await prisma.reserva.count({
        where: { espacioId: id, estado: EstadoReserva.ACTIVA },
      }),
    ).toBe(1);
  });

  it('evita que una actualización y una creación simultáneas empalmen', async () => {
    const id = await espacio();
    const row = await reservar(id, '08:00', '09:00');
    const responses = await Promise.all([
      api()
        .put(`/reservas/${row.id}`)
        .auth(userToken, { type: 'bearer' })
        .send(dto(id, '10:00', '11:00')),
      request(secondApp.getHttpServer())
        .post('/reservas')
        .auth(otherToken, { type: 'bearer' })
        .send(dto(id, '10:00', '11:00')),
    ]);
    expect(
      responses.filter((response) => [200, 201].includes(response.status)),
    ).toHaveLength(1);
    expect(
      responses.filter((response) => response.status === 409),
    ).toHaveLength(1);
  });

  it('evita que dos actualizaciones simultáneas empalmen entre instancias', async () => {
    const id = await espacio();
    const first = await reservar(id, '08:00', '09:00');
    const other = await reservar(id, '12:00', '13:00', otherToken);
    const responses = await Promise.all([
      api()
        .put(`/reservas/${first.id}`)
        .auth(userToken, { type: 'bearer' })
        .send(dto(id, '10:00', '11:00')),
      request(secondApp.getHttpServer())
        .put(`/reservas/${other.id}`)
        .auth(otherToken, { type: 'bearer' })
        .send(dto(id, '10:00', '11:00')),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
  });

  it('una actualización concurrente nunca reactiva una reserva cancelada', async () => {
    const id = await espacio();
    const row = await reservar(id);
    const responses = await Promise.all([
      api().delete(`/reservas/${row.id}`).auth(userToken, { type: 'bearer' }),
      request(secondApp.getHttpServer())
        .put(`/reservas/${row.id}`)
        .auth(userToken, { type: 'bearer' })
        .send(dto(id, '10:00', '11:00')),
    ]);
    expect(responses[0].status).toBe(200);
    expect([200, 409]).toContain(responses[1].status);
    expect(
      (await prisma.reserva.findUniqueOrThrow({ where: { id: row.id } }))
        .estado,
    ).toBe(EstadoReserva.CANCELADA);
  });
});
