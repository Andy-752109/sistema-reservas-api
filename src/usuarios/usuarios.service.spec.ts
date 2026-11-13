import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const usuario = {
    id: 1,
    nombre: 'Ramiro',
    correo: 'ramiro@example.com',
    rol: Rol.ESTUDIANTE,
  };
  const owner = { id: 1, rol: Rol.ESTUDIANTE };
  const admin = { id: 2, rol: Rol.ADMIN };
  const db = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new UsuariosService({
    usuario: db,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    db.create.mockResolvedValue(usuario);
    db.findUnique.mockResolvedValue(usuario);
    db.findMany.mockResolvedValue([usuario]);
    db.update.mockResolvedValue(usuario);
    db.delete.mockResolvedValue(usuario);
  });

  it('crea un estudiante con bcrypt real y selecciona solo datos públicos', async () => {
    const password = 'ClaveUsuario123!';
    const result = await service.crear({
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: password,
    });
    const query = (db.create.mock.lastCall as [Prisma.UsuarioCreateArgs])[0];
    expect(query.data.rol).toBe(Rol.ESTUDIANTE);
    expect(await bcrypt.compare(password, query.data.contrasena)).toBe(true);
    expect(query.select?.contrasena).not.toBe(true);
    expect(result).not.toHaveProperty('contrasena');
  });

  it('lista perfiles mediante una selección que no incluye contraseñas', async () => {
    await expect(service.listar()).resolves.toEqual([usuario]);
    const query = (
      db.findMany.mock.lastCall as [Prisma.UsuarioFindManyArgs]
    )[0];
    expect(query.select?.contrasena).not.toBe(true);
  });

  it('permite consultar al propietario y a ADMIN', async () => {
    await expect(service.consultar(1, owner)).resolves.toEqual(usuario);
    await expect(service.consultar(1, admin)).resolves.toEqual(usuario);
  });

  it('rechaza consultar o actualizar otro perfil sin tocar la base', async () => {
    await expect(service.consultar(3, owner)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.actualizar(3, { nombre: 'Intruso' }, owner),
    ).rejects.toThrow(ForbiddenException);
    expect(db.findUnique).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('responde 404 si el usuario consultado no existe', async () => {
    db.findUnique.mockResolvedValue(null);
    await expect(service.consultar(1, owner)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('impide que el propietario cambie su rol', async () => {
    await expect(
      service.actualizar(1, { rol: Rol.ADMIN }, owner),
    ).rejects.toThrow(ForbiddenException);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('permite a ADMIN cambiar roles y al propietario actualizar su nombre', async () => {
    await service.actualizar(1, { rol: Rol.DOCENTE }, admin);
    expect(db.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { nombre: undefined, correo: undefined, rol: Rol.DOCENTE },
      }),
    );
    await expect(
      service.actualizar(1, { nombre: 'Nuevo nombre' }, owner),
    ).resolves.toEqual(usuario);
  });

  it('hashea una nueva contraseña al actualizar', async () => {
    const password = 'OtraClaveUsuario123!';
    await service.actualizar(1, { contrasena: password }, owner);
    const query = (db.update.mock.lastCall as [Prisma.UsuarioUpdateArgs])[0];
    expect(typeof query.data.contrasena).toBe('string');
    expect(
      await bcrypt.compare(password, query.data.contrasena as string),
    ).toBe(true);
    expect(query.select?.contrasena).not.toBe(true);
  });

  it('responde 409 cuando la base impide borrar un usuario con reservas', async () => {
    db.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Clave foránea', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );
    await expect(service.eliminar(1)).rejects.toThrow(
      new ConflictException(
        'No se puede eliminar un usuario con reservas; se conserva su historial',
      ),
    );
  });

  it('elimina un usuario y propaga errores desconocidos de la base', async () => {
    await expect(service.eliminar(1)).resolves.toBeUndefined();
    const error = new Error('Conexión interrumpida');
    db.delete.mockRejectedValue(error);
    await expect(service.eliminar(1)).rejects.toBe(error);
  });

  it('traduce correos duplicados y actualizaciones/eliminaciones ausentes', async () => {
    db.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.crear({
        nombre: 'Duplicado',
        correo: usuario.correo,
        contrasena: 'ClaveUsuario123!',
      }),
    ).rejects.toThrow(ConflictException);
    const missing = new Prisma.PrismaClientKnownRequestError('Ausente', {
      code: 'P2025',
      clientVersion: 'test',
    });
    db.update.mockRejectedValue(missing);
    db.delete.mockRejectedValue(missing);
    await expect(
      service.actualizar(1, { nombre: 'Ausente' }, owner),
    ).rejects.toThrow(NotFoundException);
    await expect(service.eliminar(1)).rejects.toThrow(NotFoundException);
  });
});
