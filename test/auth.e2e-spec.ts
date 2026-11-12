import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EstadoReserva, Rol } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';

interface PublicUser {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  contrasena?: string;
}

describe('Usuarios y autenticación (e2e con PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let usuario: PublicUser;
  let otro: PublicUser;
  let adminId: number;
  let token: string;
  let adminToken: string;
  const createdIds: number[] = [];
  const spaceIds: number[] = [];
  const prefix = randomUUID();
  const password = 'ClaveSegura123!';

  const api = () => request(app.getHttpServer());
  const email = (name: string) => `${prefix}-${name}@example.com`;

  async function registrar(name: string): Promise<PublicUser> {
    const response = await api()
      .post('/usuarios')
      .send({
        nombre: name,
        correo: email(name),
        contrasena: password,
        rol: 'ADMIN',
      })
      .expect(201);
    const body = response.body as PublicUser;
    createdIds.push(body.id);
    return body;
  }

  async function login(correo: string, contrasena = password): Promise<string> {
    const response = await api()
      .post('/login')
      .send({ correo, contrasena })
      .expect(200);
    return (response.body as { access_token: string }).access_token;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    usuario = await registrar('usuario');
    otro = await registrar('otro');
    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Admin de prueba',
        correo: email('admin'),
        contrasena: await bcrypt.hash(password, 10),
        rol: Rol.ADMIN,
      },
    });
    adminId = admin.id;
    createdIds.push(adminId);
    token = await login(usuario.correo);
    adminToken = await login(admin.correo);
  });

  afterAll(async () => {
    try {
      if (prisma && createdIds.length) {
        await prisma.reserva.deleteMany({
          where: { usuarioId: { in: createdIds } },
        });
        await prisma.espacio.deleteMany({ where: { id: { in: spaceIds } } });
        await prisma.usuario.deleteMany({ where: { id: { in: createdIds } } });
      }
    } finally {
      if (app) await app.close();
    }
  });

  it('registra como ESTUDIANTE, almacena bcrypt y nunca devuelve el hash', async () => {
    expect(usuario.rol).toBe(Rol.ESTUDIANTE);
    expect(usuario).not.toHaveProperty('contrasena');
    const stored = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuario.id },
    });
    expect(stored.contrasena).not.toBe(password);
    expect(await bcrypt.compare(password, stored.contrasena)).toBe(true);
  });

  it('emite un JWT firmado con sub, rol y expiración', () => {
    const payload = jwt.verify<{
      sub: number;
      rol: Rol;
      exp: number;
      contrasena?: string;
    }>(token);
    expect(payload.sub).toBe(usuario.id);
    expect(payload.rol).toBe(Rol.ESTUDIANTE);
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    expect(payload).not.toHaveProperty('contrasena');
  });

  it('normaliza el correo en registro y login', async () => {
    const response = await api()
      .post('/usuarios')
      .send({
        nombre: ' Normalizado ',
        correo: `  ${email('NORMALIZADO')}  `,
        contrasena: password,
      })
      .expect(201);
    const body = response.body as PublicUser;
    createdIds.push(body.id);
    expect(body.correo).toBe(email('normalizado'));
    expect(body.nombre).toBe('Normalizado');
    await login(` ${email('NORMALIZADO')} `);
  });

  it('rechaza contraseñas incorrectas y correos inexistentes con 401', async () => {
    await api()
      .post('/login')
      .send({ correo: usuario.correo, contrasena: 'Incorrecta123!' })
      .expect(401);
    await api()
      .post('/login')
      .send({ correo: email('ausente'), contrasena: password })
      .expect(401);
  });

  it('rechaza correo duplicado con 409', async () => {
    await api()
      .post('/usuarios')
      .send({
        nombre: 'Duplicado',
        correo: usuario.correo,
        contrasena: password,
      })
      .expect(409);
  });

  it('valida DTOs, nulls y el límite de bytes de bcrypt', async () => {
    for (const body of [
      { nombre: ' ', correo: email('invalido'), contrasena: password },
      { nombre: 'Usuario', correo: 'correo-invalido', contrasena: password },
      { nombre: 'Usuario', correo: email('corta'), contrasena: 'corta' },
      { nombre: 'Usuario', correo: email('bytes'), contrasena: 'á'.repeat(37) },
    ]) {
      await api().post('/usuarios').send(body).expect(400);
    }
    await api()
      .patch(`/usuarios/${usuario.id}`)
      .auth(token, { type: 'bearer' })
      .send({ nombre: null })
      .expect(400);
  });

  it('rechaza solicitudes sin token, tokens inválidos y expirados', async () => {
    await api().get(`/usuarios/${usuario.id}`).expect(401);
    await api()
      .get(`/usuarios/${usuario.id}`)
      .auth('token-invalido', { type: 'bearer' })
      .expect(401);
    const expired = jwt.sign(
      { sub: usuario.id, rol: Rol.ESTUDIANTE },
      { expiresIn: -1 },
    );
    await api()
      .get(`/usuarios/${usuario.id}`)
      .auth(expired, { type: 'bearer' })
      .expect(401);
    const forged = jwt.sign(
      { sub: usuario.id, rol: Rol.ADMIN },
      { secret: 'firma-incorrecta-solo-para-prueba' },
    );
    await api().get('/usuarios').auth(forged, { type: 'bearer' }).expect(401);
  });

  it('permite consultar al propio usuario sin exponer el hash', async () => {
    const response = await api()
      .get(`/usuarios/${usuario.id}`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(response.body).not.toHaveProperty('contrasena');
  });

  it('impide consultar, modificar, eliminar o listar usuarios ajenos', async () => {
    await api()
      .get(`/usuarios/${otro.id}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    await api()
      .patch(`/usuarios/${otro.id}`)
      .auth(token, { type: 'bearer' })
      .send({ nombre: 'Intruso' })
      .expect(403);
    await api()
      .delete(`/usuarios/${otro.id}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    await api()
      .delete(`/usuarios/${usuario.id}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    await api().get('/usuarios').auth(token, { type: 'bearer' }).expect(403);
  });

  it('permite actualizar el perfil propio pero impide elevar su rol', async () => {
    const response = await api()
      .patch(`/usuarios/${usuario.id}`)
      .auth(token, { type: 'bearer' })
      .send({ nombre: 'Nombre actualizado' })
      .expect(200);
    expect((response.body as PublicUser).nombre).toBe('Nombre actualizado');
    expect(response.body).not.toHaveProperty('contrasena');
    await api()
      .patch(`/usuarios/${usuario.id}`)
      .auth(token, { type: 'bearer' })
      .send({ rol: Rol.ADMIN })
      .expect(403);
  });

  it('permite a ADMIN listar, consultar y cambiar roles sin exponer hashes', async () => {
    const list = await api()
      .get('/usuarios')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    for (const user of list.body as PublicUser[])
      expect(user).not.toHaveProperty('contrasena');
    await api()
      .get(`/usuarios/${otro.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);
    const update = await api()
      .patch(`/usuarios/${otro.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ rol: Rol.DOCENTE })
      .expect(200);
    expect((update.body as PublicUser).rol).toBe(Rol.DOCENTE);
    expect(update.body).not.toHaveProperty('contrasena');
  });

  it('aplica inmediatamente una reducción de permisos aunque el JWT diga ADMIN', async () => {
    const temp = await registrar('admin-temporal');
    await prisma.usuario.update({
      where: { id: temp.id },
      data: { rol: Rol.ADMIN },
    });
    const tempToken = await login(temp.correo);
    await api()
      .patch(`/usuarios/${temp.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ rol: Rol.ESTUDIANTE })
      .expect(200);
    await api()
      .get('/usuarios')
      .auth(tempToken, { type: 'bearer' })
      .expect(403);
  });

  it('actualiza contraseñas usando bcrypt y permite el login con la nueva clave', async () => {
    const fresh = await registrar('password');
    const freshToken = await login(fresh.correo);
    const nextPassword = 'OtraClaveSegura456!';
    const response = await api()
      .patch(`/usuarios/${fresh.id}`)
      .auth(freshToken, { type: 'bearer' })
      .send({ contrasena: nextPassword })
      .expect(200);
    expect(response.body).not.toHaveProperty('contrasena');
    await login(fresh.correo, nextPassword);
    await api()
      .post('/login')
      .send({ correo: fresh.correo, contrasena: password })
      .expect(401);
  });

  it.each(Object.values(EstadoReserva))(
    'impide eliminar usuarios con reservas %s y conserva todo su historial',
    async (estado) => {
      const fresh = await registrar(`historial-${estado}`);
      const freshToken = await login(fresh.correo);
      const espacio = await prisma.espacio.create({
        data: {
          nombre: `${prefix}-${estado}`,
          tipo: 'CUBICULO',
          capacidad: 4,
          ubicacion: 'Prueba historial',
        },
      });
      spaceIds.push(espacio.id);
      const reserva = await prisma.reserva.create({
        data: {
          usuarioId: fresh.id,
          espacioId: espacio.id,
          inicio: new Date('2026-11-10T15:00:00Z'),
          fin: new Date('2026-11-10T16:00:00Z'),
          estado,
        },
      });
      const originalUser = await prisma.usuario.findUniqueOrThrow({
        where: { id: fresh.id },
      });

      // Protege incluso si se omite la API o se inserta una reserva concurrente.
      await expect(
        prisma.usuario.delete({ where: { id: fresh.id } }),
      ).rejects.toMatchObject({ code: 'P2003' });

      const response = await api()
        .delete(`/usuarios/${fresh.id}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(409);
      expect(response.body).toMatchObject({
        statusCode: 409,
        message:
          'No se puede eliminar un usuario con reservas; se conserva su historial',
      });
      expect(
        await prisma.usuario.findUnique({ where: { id: fresh.id } }),
      ).toEqual(originalUser);
      expect(
        await prisma.reserva.findMany({ where: { usuarioId: fresh.id } }),
      ).toEqual([reserva]);
      await api()
        .get(`/usuarios/${fresh.id}`)
        .auth(freshToken, { type: 'bearer' })
        .expect(200);
    },
  );

  it('ADMIN elimina usuarios sin reservas y sus tokens dejan de ser válidos', async () => {
    const fresh = await registrar('eliminar');
    const freshToken = await login(fresh.correo);
    await api()
      .delete(`/usuarios/${fresh.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(204);
    await api()
      .get(`/usuarios/${fresh.id}`)
      .auth(freshToken, { type: 'bearer' })
      .expect(401);
    await api()
      .get(`/usuarios/${fresh.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
    await api()
      .patch(`/usuarios/${fresh.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ nombre: 'Ausente' })
      .expect(404);
    await api()
      .delete(`/usuarios/${fresh.id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(404);
  });
});
