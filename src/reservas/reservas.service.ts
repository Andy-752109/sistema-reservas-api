import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import type { AuthUser } from '../auth/auth-user';
import { Prisma } from '../generated/prisma/client';
import { EstadoReserva, Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { GuardarReservaDto } from './dto/guardar-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(actor: AuthUser) {
    return this.prisma.reserva.findMany({
      where: actor.rol === Rol.ADMIN ? {} : { usuarioId: actor.id },
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
  }

  async crear(dto: GuardarReservaDto, actor: AuthUser) {
    const { inicio, fin } = this.intervalo(dto);
    return this.prisma.$transaction(
      async (tx) => {
        await this.lockEspacioActivo(tx, dto.espacioId);
        await this.validarTraslape(tx, dto.espacioId, inicio, fin);
        return tx.reserva.create({
          data: {
            usuarioId: actor.id,
            espacioId: dto.espacioId,
            inicio,
            fin,
            estado: EstadoReserva.ACTIVA,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async actualizar(id: number, dto: GuardarReservaDto, actor: AuthUser) {
    this.validateId(id);
    const { inicio, fin } = this.intervalo(dto);
    return this.prisma.$transaction(
      async (tx) => {
        const reserva = await this.lockReserva(tx, id, actor);
        if (reserva.estado !== EstadoReserva.ACTIVA)
          throw new ConflictException(
            'Solo se pueden modificar reservas ACTIVAS',
          );
        await this.lockEspacioActivo(tx, dto.espacioId);
        await this.validarTraslape(tx, dto.espacioId, inicio, fin, id);
        return tx.reserva.update({
          where: { id },
          data: { espacioId: dto.espacioId, inicio, fin },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async cancelar(id: number, actor: AuthUser) {
    this.validateId(id);
    return this.prisma.$transaction(
      async (tx) => {
        await this.lockReserva(tx, id, actor);
        return tx.reserva.update({
          where: { id },
          data: { estado: EstadoReserva.CANCELADA },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async validarTraslape(
    tx: Prisma.TransactionClient,
    espacioId: number,
    inicio: Date,
    fin: Date,
    excluirId?: number,
  ): Promise<void> {
    const conflicto = await tx.reserva.findFirst({
      where: {
        espacioId,
        estado: EstadoReserva.ACTIVA,
        inicio: { lt: fin },
        fin: { gt: inicio },
        ...(excluirId === undefined ? {} : { id: { not: excluirId } }),
      },
      select: { id: true },
    });
    if (conflicto)
      throw new ConflictException(
        'El espacio ya tiene una reserva ACTIVA en ese intervalo',
      );
  }

  private intervalo(dto: GuardarReservaDto): { inicio: Date; fin: Date } {
    this.validateId(dto.espacioId);
    const inicio = DateTime.fromISO(dto.inicio, { setZone: true });
    const fin = DateTime.fromISO(dto.fin, { setZone: true });
    const timezone = /(?:Z|[+-]\d{2}:\d{2})$/;
    if (
      !inicio.isValid ||
      !fin.isValid ||
      inicio.year < 1 ||
      fin.year < 1 ||
      !timezone.test(dto.inicio) ||
      !timezone.test(dto.fin) ||
      inicio.toMillis() >= fin.toMillis()
    ) {
      throw new BadRequestException(
        'Usa fechas ISO 8601 con zona horaria explÃ­cita e inicio anterior a fin',
      );
    }
    return { inicio: inicio.toJSDate(), fin: fin.toJSDate() };
  }

  private async lockEspacioActivo(
    tx: Prisma.TransactionClient,
    espacioId: number,
  ): Promise<void> {
    // Serializa la validaciÃ³n y escritura de reservas del mismo espacio.
    // READ COMMITTED permite ver la reserva que confirmÃ³ el titular anterior.
    const espacios = await tx.$queryRaw<
      { id: number; activo: boolean }[]
    >`SELECT id, activo FROM espacios WHERE id = ${espacioId} FOR NO KEY UPDATE`;
    if (!espacios.length) throw new NotFoundException('Espacio no encontrado');
    if (!espacios[0].activo)
      throw new BadRequestException('El espacio estÃ¡ inactivo');
  }

  private async lockReserva(
    tx: Prisma.TransactionClient,
    id: number,
    actor: AuthUser,
  ) {
    const rows = await tx.$queryRaw<
      { id: number }[]
    >`SELECT id FROM reservas WHERE id = ${id} FOR NO KEY UPDATE`;
    if (!rows.length) throw new NotFoundException('Reserva no encontrada');
    const reserva = await tx.reserva.findUniqueOrThrow({ where: { id } });
    if (actor.rol !== Rol.ADMIN && reserva.usuarioId !== actor.id)
      throw new ForbiddenException('No tienes acceso a esta reserva');
    return reserva;
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException(
        'El id debe ser un entero positivo vÃ¡lido',
      );
  }
}
