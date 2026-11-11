import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { Prisma } from '../generated/prisma/client';
import { EstadoReserva, Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ReservasService } from './reservas.service';

describe('ReservasService', () => {
  const findFirst = jest.fn();
  const transaction = jest.fn();
  const prisma = { $transaction: transaction };
  const tx = { reserva: { findFirst } } as unknown as Prisma.TransactionClient;
  const actor: AuthUser = { id: 1, rol: Rol.ESTUDIANTE };
  let service: ReservasService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ReservasService(prisma as unknown as PrismaService);
  });

  it('rechaza un traslape reportado por PostgreSQL con 409', async () => {
    findFirst.mockResolvedValue({ id: 9 });
    await expect(
      service.validarTraslape(
        tx,
        2,
        new Date('2026-11-10T15:00:00Z'),
        new Date('2026-11-10T16:00:00Z'),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('excluye la propia reserva y considera solo ACTIVAS del mismo espacio', async () => {
    findFirst.mockResolvedValue(null);
    const inicio = new Date('2026-11-10T15:00:00Z');
    const fin = new Date('2026-11-10T16:00:00Z');
    await expect(
      service.validarTraslape(tx, 2, inicio, fin, 7),
    ).resolves.toBeUndefined();
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        espacioId: 2,
        estado: EstadoReserva.ACTIVA,
        inicio: { lt: fin },
        fin: { gt: inicio },
        id: { not: 7 },
      },
      select: { id: true },
    });
  });

  it.each([
    ['2026-11-10T10:00:00Z', '2026-11-10T10:00:00Z'],
    ['2026-11-10T11:00:00Z', '2026-11-10T10:00:00Z'],
    ['2026-11-10T10:00:00-06:00', '2026-11-10T15:00:00Z'],
    ['2026-02-30T10:00:00Z', '2026-03-01T12:00:00Z'],
    ['2026-11-10T10:00:00', '2026-11-10T12:00:00'],
    ['0000-01-01T10:00:00Z', '0000-01-01T11:00:00Z'],
  ])(
    'rechaza intervalo inválido %s / %s antes de abrir transacciones',
    async (inicio, fin) => {
      await expect(
        service.crear({ espacioId: 1, inicio, fin }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(transaction).not.toHaveBeenCalled();
    },
  );
});

describe('ReservasService: reglas de negocio con Prisma simulado', () => {
  const owner: AuthUser = { id: 1, rol: Rol.ESTUDIANTE };
  const admin: AuthUser = { id: 2, rol: Rol.ADMIN };
  const stranger: AuthUser = { id: 3, rol: Rol.DOCENTE };
  const dto = (inicio = '10:00', fin = '12:00', espacioId = 2) => ({
    espacioId,
    inicio: `2026-11-10T${inicio}:00Z`,
    fin: `2026-11-10T${fin}:00Z`,
  });
  const row = {
    id: 7,
    usuarioId: 1,
    espacioId: 2,
    estado: EstadoReserva.ACTIVA,
    inicio: new Date('2026-11-10T10:00:00Z'),
    fin: new Date('2026-11-10T12:00:00Z'),
  };
  const db = {
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const raw = jest.fn();
  const tx = {
    reserva: db,
    $queryRaw: raw,
  } as unknown as Prisma.TransactionClient;
  const transaction = jest.fn();
  let service: ReservasService;

  beforeEach(() => {
    jest.resetAllMocks();
    db.findFirst.mockResolvedValue(null);
    db.findUniqueOrThrow.mockResolvedValue(row);
    db.create.mockResolvedValue(row);
    db.update.mockResolvedValue(row);
    db.findMany.mockResolvedValue([row]);
    raw.mockImplementation((sql: TemplateStringsArray, id: number) =>
      Promise.resolve(
        sql[0].includes('FROM espacios') ? [{ id, activo: true }] : [{ id }],
      ),
    );
    transaction.mockImplementation(
      (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx),
    );
    service = new ReservasService({
      reserva: db,
      $transaction: transaction,
    } as unknown as PrismaService);
  });

  it.each([
    ['mismo horario', '10:00', '12:00'],
    ['se cruza al inicio', '09:00', '11:00'],
    ['se cruza al final', '11:00', '13:00'],
    ['contenida', '10:30', '11:00'],
    ['contiene a la existente', '09:00', '13:00'],
  ])('devuelve 409 y no escribe: %s', async (_caso, inicio, fin) => {
    db.findFirst.mockResolvedValue({ id: row.id });
    await expect(service.crear(dto(inicio, fin), owner)).rejects.toThrow(
      ConflictException,
    );
    expect(db.create).not.toHaveBeenCalled();
    const query = (
      db.findFirst.mock.lastCall as [Prisma.ReservaFindFirstArgs]
    )[0];
    expect(query.where).toEqual({
      espacioId: 2,
      estado: EstadoReserva.ACTIVA,
      inicio: { lt: new Date(dto(inicio, fin).fin) },
      fin: { gt: new Date(dto(inicio, fin).inicio) },
    });
  });

  it.each([
    ['contigua por la izquierda', '09:00', '10:00', 2],
    ['contigua por la derecha', '12:00', '13:00', 2],
    ['otro espacio', '10:00', '12:00', 3],
    ['reserva CANCELADA existente', '10:00', '12:00', 2],
  ])(
    'permite crear si la consulta de ACTIVAS no encuentra conflicto: %s',
    async (_caso, inicio, fin, espacioId) => {
      const data = dto(inicio, fin, espacioId);
      await expect(service.crear(data, owner)).resolves.toEqual(row);
      expect(db.findFirst).toHaveBeenCalledWith({
        where: {
          espacioId,
          estado: EstadoReserva.ACTIVA,
          inicio: { lt: new Date(data.fin) },
          fin: { gt: new Date(data.inicio) },
        },
        select: { id: true },
      });
      expect(db.create).toHaveBeenCalledWith({
        data: {
          usuarioId: owner.id,
          espacioId,
          inicio: new Date(data.inicio),
          fin: new Date(data.fin),
          estado: EstadoReserva.ACTIVA,
        },
      });
    },
  );

  it('rechaza espacios inexistentes e inactivos sin guardar reservas', async () => {
    raw.mockResolvedValueOnce([]);
    await expect(service.crear(dto(), owner)).rejects.toThrow(
      NotFoundException,
    );
    raw.mockResolvedValueOnce([{ id: 2, activo: false }]);
    await expect(service.crear(dto(), owner)).rejects.toThrow(
      BadRequestException,
    );
    expect(db.create).not.toHaveBeenCalled();
  });

  it('devuelve los mensajes de error con acentos en UTF-8', async () => {
    raw.mockResolvedValueOnce([{ id: 2, activo: false }]);
    await expect(service.crear(dto(), owner)).rejects.toThrow(
      'El espacio está inactivo',
    );
    await expect(service.crear(dto('12:00', '10:00'), owner)).rejects.toThrow(
      'Usa fechas ISO 8601 con zona horaria explícita e inicio anterior a fin',
    );
    await expect(service.cancelar(0, owner)).rejects.toThrow(
      'El id debe ser un entero positivo válido',
    );
  });

  it('lista reservas propias y permite a ADMIN consultar todas', async () => {
    await service.listar(owner);
    expect(db.findMany).toHaveBeenLastCalledWith({
      where: { usuarioId: 1 },
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
    await service.listar(admin);
    expect(db.findMany).toHaveBeenLastCalledWith({
      where: {},
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
  });

  it('actualiza la propia reserva excluyéndola del traslape', async () => {
    await expect(service.actualizar(7, dto(), owner)).resolves.toEqual(row);
    const query = (
      db.findFirst.mock.lastCall as [Prisma.ReservaFindFirstArgs]
    )[0];
    expect(query.where?.id).toEqual({ not: 7 });
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('permite a ADMIN modificar y cancelar una reserva ajena', async () => {
    await expect(service.actualizar(7, dto(), admin)).resolves.toEqual(row);
    db.update.mockResolvedValue({ ...row, estado: EstadoReserva.CANCELADA });
    await expect(service.cancelar(7, admin)).resolves.toMatchObject({
      estado: EstadoReserva.CANCELADA,
    });
  });

  it('cancelar una reserva ajena devuelve 403 y no modifica ni borra', async () => {
    await expect(service.cancelar(7, stranger)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.actualizar(7, dto(), stranger)).rejects.toThrow(
      ForbiddenException,
    );
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('cancelar cambia estado a CANCELADA y conserva el registro', async () => {
    db.update.mockResolvedValue({ ...row, estado: EstadoReserva.CANCELADA });
    await expect(service.cancelar(7, owner)).resolves.toMatchObject({
      id: 7,
      estado: EstadoReserva.CANCELADA,
    });
    expect(db.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { estado: EstadoReserva.CANCELADA },
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it.each([EstadoReserva.CANCELADA, EstadoReserva.FINALIZADA])(
    'no modifica una reserva %s',
    async (estado) => {
      db.findUniqueOrThrow.mockResolvedValue({ ...row, estado });
      await expect(service.actualizar(7, dto(), owner)).rejects.toThrow(
        ConflictException,
      );
      expect(db.update).not.toHaveBeenCalled();
    },
  );

  it('no actualiza ni cancela una reserva inexistente', async () => {
    raw.mockResolvedValue([]);
    await expect(service.cancelar(7, owner)).rejects.toThrow(NotFoundException);
    await expect(service.actualizar(7, dto(), owner)).rejects.toThrow(
      NotFoundException,
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 2147483648])(
    'rechaza id inválido %s sin abrir transacciones',
    async (id) => {
      await expect(service.cancelar(id, owner)).rejects.toThrow(
        BadRequestException,
      );
      expect(transaction).not.toHaveBeenCalled();
    },
  );
});
