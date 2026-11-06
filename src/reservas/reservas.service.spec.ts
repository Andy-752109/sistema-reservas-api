import { BadRequestException, ConflictException } from '@nestjs/common';
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
