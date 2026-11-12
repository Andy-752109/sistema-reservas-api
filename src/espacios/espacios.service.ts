import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime, IANAZone } from 'luxon';
import { Prisma } from '../generated/prisma/client';
import { EstadoReserva } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEspacioDto } from './dto/crear-espacio.dto';

@Injectable()
export class EspaciosService {
  private readonly apertura: string;
  private readonly cierre: string;
  private readonly zona: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.apertura = config.get<string>('ESPACIOS_HORA_APERTURA', '07:00');
    this.cierre = config.get<string>('ESPACIOS_HORA_CIERRE', '21:00');
    this.zona = config.get<string>(
      'ESPACIOS_ZONA_HORARIA',
      'America/Mexico_City',
    );
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (
      !timePattern.test(this.apertura) ||
      !timePattern.test(this.cierre) ||
      this.apertura >= this.cierre ||
      !IANAZone.isValidZone(this.zona)
    ) {
      throw new Error(
        'Configuración de espacios inválida: usa horas HH:mm, apertura anterior al cierre y zona IANA válida',
      );
    }
  }

  listar(tipo?: string) {
    return this.prisma.espacio.findMany({
      where: { activo: true, tipo },
      orderBy: { id: 'asc' },
    });
  }

  async consultar(id: number) {
    this.validateId(id);
    const espacio = await this.prisma.espacio.findFirst({
      where: { id, activo: true },
    });
    if (!espacio) throw new NotFoundException('Espacio activo no encontrado');
    return espacio;
  }

  async crear(dto: CrearEspacioDto) {
    try {
      return await this.prisma.espacio.create({ data: dto });
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async actualizar(id: number, dto: CrearEspacioDto) {
    this.validateId(id);
    try {
      return await this.prisma.espacio.update({ where: { id }, data: dto });
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async eliminar(
    id: number,
  ): Promise<{ id: number; accion: 'eliminado' | 'desactivado' }> {
    this.validateId(id);
    const espacio = await this.prisma.espacio.findUnique({
      where: { id },
      select: { _count: { select: { reservas: true } } },
    });
    if (!espacio) throw new NotFoundException('Espacio no encontrado');
    try {
      if (espacio._count.reservas > 0) return await this.desactivar(id);
      try {
        await this.prisma.espacio.delete({ where: { id } });
        return { id, accion: 'eliminado' };
      } catch (error: unknown) {
        // La FK protege una reserva insertada después de consultar el contador.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2003'
        )
          return await this.desactivar(id);
        throw error;
      }
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async verDisponibilidad(id: number, fecha: string) {
    this.validateId(id);
    const dia = DateTime.fromISO(fecha, { zone: this.zona });
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      !dia.isValid ||
      dia.year < 1 ||
      dia.toISODate() !== fecha
    ) {
      throw new BadRequestException(
        'Fecha inválida; usa YYYY-MM-DD y una fecha existente',
      );
    }
    const inicio = DateTime.fromISO(`${fecha}T${this.apertura}`, {
      zone: this.zona,
    });
    const fin = DateTime.fromISO(`${fecha}T${this.cierre}`, {
      zone: this.zona,
    });
    if (
      !inicio.isValid ||
      !fin.isValid ||
      inicio.toFormat('HH:mm') !== this.apertura ||
      fin.toFormat('HH:mm') !== this.cierre ||
      inicio.getPossibleOffsets().length !== 1 ||
      fin.getPossibleOffsets().length !== 1
    ) {
      throw new BadRequestException(
        'El horario de operación es inexistente o ambiguo para esa fecha y zona horaria',
      );
    }
    await this.consultar(id);
    const reservas = await this.prisma.reserva.findMany({
      where: {
        espacioId: id,
        estado: EstadoReserva.ACTIVA,
        inicio: { lt: fin.toJSDate() },
        fin: { gt: inicio.toJSDate() },
      },
      select: { inicio: true, fin: true },
      orderBy: { inicio: 'asc' },
    });
    const opening = inicio.toMillis();
    const closing = fin.toMillis();
    const ocupados = reservas
      .map((reserva) => ({
        inicio: Math.max(opening, reserva.inicio.getTime()),
        fin: Math.min(closing, reserva.fin.getTime()),
      }))
      .filter((reserva) => reserva.inicio < reserva.fin)
      .sort((a, b) => a.inicio - b.inicio);
    const bloques: { inicio: number; fin: number }[] = [];
    let cursor = opening;
    for (const reserva of ocupados) {
      if (reserva.inicio > cursor)
        bloques.push({ inicio: cursor, fin: reserva.inicio });
      cursor = Math.max(cursor, reserva.fin);
    }
    if (cursor < closing) bloques.push({ inicio: cursor, fin: closing });
    return {
      espacioId: id,
      fecha,
      zonaHoraria: this.zona,
      horario: { inicio: inicio.toISO(), fin: fin.toISO() },
      bloquesLibres: bloques.map((bloque) => ({
        inicio: DateTime.fromMillis(bloque.inicio, { zone: this.zona }).toISO(),
        fin: DateTime.fromMillis(bloque.fin, { zone: this.zona }).toISO(),
      })),
    };
  }

  private async desactivar(
    id: number,
  ): Promise<{ id: number; accion: 'desactivado' }> {
    await this.prisma.espacio.update({
      where: { id },
      data: { activo: false },
    });
    return { id, accion: 'desactivado' };
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647)
      throw new BadRequestException('El id debe ser un entero positivo válido');
  }

  private handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException('El nombre del espacio ya está registrado');
      if (error.code === 'P2025')
        throw new NotFoundException('Espacio no encontrado');
    }
    throw error;
  }
}
