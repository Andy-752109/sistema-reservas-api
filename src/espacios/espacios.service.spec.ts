import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoReserva } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EspaciosService } from './espacios.service';

const configFor = (values: Record<string, string> = {}) =>
  ({
    get: (key: string, fallback: string) => values[key] ?? fallback,
  }) as unknown as ConfigService;

describe('EspaciosService.eliminar', () => {
  it('desactiva si una reserva concurrente impide el borrado mediante la FK', async () => {
    const findUnique = jest.fn().mockResolvedValue({ _count: { reservas: 0 } });
    const error = new Prisma.PrismaClientKnownRequestError(
      'Reserva concurrente',
      {
        code: 'P2003',
        clientVersion: 'test',
      },
    );
    const remove = jest.fn().mockRejectedValue(error);
    const update = jest.fn().mockResolvedValue({ activo: false });
    const prisma = { espacio: { findUnique, delete: remove, update } };
    const service = new EspaciosService(
      prisma as unknown as PrismaService,
      configFor(),
    );
    await expect(service.eliminar(1)).resolves.toEqual({
      id: 1,
      accion: 'desactivado',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { activo: false },
    });
  });
});

describe('EspaciosService.verDisponibilidad', () => {
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const prisma = { espacio: { findFirst }, reserva: { findMany } };
  const fecha = '2026-11-10';
  const at = (hora: string) => new Date(`${fecha}T${hora}:00-06:00`);
  const makeService = (config: Record<string, string> = {}) =>
    new EspaciosService(prisma as unknown as PrismaService, configFor(config));
  let service: EspaciosService;

  beforeEach(() => {
    jest.resetAllMocks();
    findFirst.mockResolvedValue({ id: 1, activo: true });
    findMany.mockResolvedValue([]);
    service = makeService();
  });

  it.each<{
    caso: string;
    ocupados: [string, string][];
    libres: [string, string][];
  }>([
    { caso: 'día sin reservas', ocupados: [], libres: [['07:00', '21:00']] },
    {
      caso: 'reservas separadas',
      ocupados: [
        ['09:00', '10:00'],
        ['12:00', '13:00'],
      ],
      libres: [
        ['07:00', '09:00'],
        ['10:00', '12:00'],
        ['13:00', '21:00'],
      ],
    },
    {
      caso: 'ocupación al abrir',
      ocupados: [['07:00', '09:00']],
      libres: [['09:00', '21:00']],
    },
    {
      caso: 'ocupación al cerrar',
      ocupados: [['19:00', '21:00']],
      libres: [['07:00', '19:00']],
    },
    { caso: 'ocupación total', ocupados: [['06:00', '22:00']], libres: [] },
    {
      caso: 'reservas contiguas',
      ocupados: [
        ['07:00', '08:00'],
        ['08:00', '09:00'],
      ],
      libres: [['09:00', '21:00']],
    },
    {
      caso: 'traslapes desordenados y anidados',
      ocupados: [
        ['10:00', '13:00'],
        ['09:00', '11:00'],
        ['10:00', '10:30'],
      ],
      libres: [
        ['07:00', '09:00'],
        ['13:00', '21:00'],
      ],
    },
    {
      caso: 'reservas fuera de horario o justo en los límites',
      ocupados: [
        ['05:00', '07:00'],
        ['21:00', '23:00'],
      ],
      libres: [['07:00', '21:00']],
    },
    {
      caso: 'recorte al horario',
      ocupados: [
        ['06:00', '08:00'],
        ['20:00', '23:00'],
      ],
      libres: [['08:00', '20:00']],
    },
    {
      caso: 'intervalos vacíos',
      ocupados: [['10:00', '10:00']],
      libres: [['07:00', '21:00']],
    },
  ])('$caso', async ({ ocupados, libres }) => {
    findMany.mockResolvedValue(
      ocupados.map(([inicio, fin]) => ({ inicio: at(inicio), fin: at(fin) })),
    );
    const result = await service.verDisponibilidad(1, fecha);
    expect(result.bloquesLibres).toEqual(
      libres.map(([inicio, fin]) => ({
        inicio: `${fecha}T${inicio}:00.000-06:00`,
        fin: `${fecha}T${fin}:00.000-06:00`,
      })),
    );
  });

  it('consulta solo reservas ACTIVAS que se traslapan, sin datos de usuarios', async () => {
    await service.verDisponibilidad(1, fecha);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        espacioId: 1,
        estado: EstadoReserva.ACTIVA,
        inicio: { lt: at('21:00') },
        fin: { gt: at('07:00') },
      },
      select: { inicio: true, fin: true },
      orderBy: { inicio: 'asc' },
    });
  });

  it('recorta una reserva que comenzó el día anterior', async () => {
    findMany.mockResolvedValue([
      { inicio: new Date('2026-11-09T23:00:00-06:00'), fin: at('08:00') },
    ]);
    const result = await service.verDisponibilidad(1, fecha);
    expect(result.bloquesLibres).toEqual([
      {
        inicio: `${fecha}T08:00:00.000-06:00`,
        fin: `${fecha}T21:00:00.000-06:00`,
      },
    ]);
  });

  it('respeta un horario configurable sin depender de la zona del servidor', async () => {
    service = makeService({
      ESPACIOS_HORA_APERTURA: '08:30',
      ESPACIOS_HORA_CIERRE: '12:30',
      ESPACIOS_ZONA_HORARIA: 'America/Mexico_City',
    });
    const result = await service.verDisponibilidad(1, fecha);
    expect(result.horario).toEqual({
      inicio: `${fecha}T08:30:00.000-06:00`,
      fin: `${fecha}T12:30:00.000-06:00`,
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        espacioId: 1,
        estado: EstadoReserva.ACTIVA,
        inicio: { lt: new Date('2026-11-10T18:30:00Z') },
        fin: { gt: new Date('2026-11-10T14:30:00Z') },
      },
      select: { inicio: true, fin: true },
      orderBy: { inicio: 'asc' },
    });
  });

  it('usa el offset de la zona para la fecha solicitada (verano e invierno)', async () => {
    service = makeService({ ESPACIOS_ZONA_HORARIA: 'America/New_York' });
    expect(
      (await service.verDisponibilidad(1, '2026-07-10')).horario.inicio,
    ).toBe('2026-07-10T07:00:00.000-04:00');
    expect(
      (await service.verDisponibilidad(1, '2026-12-10')).horario.inicio,
    ).toBe('2026-12-10T07:00:00.000-05:00');
  });

  it.each([
    '2026-02-30',
    '2026-02-29',
    '2026-13-01',
    '2026-1-01',
    '2026-11-10T00:00:00Z',
    '0000-01-01',
    '',
  ])('rechaza fecha inválida %s antes de consultar datos', async (invalid) => {
    await expect(service.verDisponibilidad(1, invalid)).rejects.toThrow(
      BadRequestException,
    );
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('acepta un día bisiesto real', async () => {
    expect((await service.verDisponibilidad(1, '2028-02-29')).fecha).toBe(
      '2028-02-29',
    );
  });

  it('rechaza espacios ausentes o inactivos', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.verDisponibilidad(1, fecha)).rejects.toThrow(
      NotFoundException,
    );
    expect(findFirst).toHaveBeenCalledWith({ where: { id: 1, activo: true } });
    expect(findMany).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, 2147483648])('rechaza id inválido %s', async (id) => {
    await expect(service.verDisponibilidad(id, fecha)).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each([
    { ESPACIOS_HORA_APERTURA: '21:00', ESPACIOS_HORA_CIERRE: '07:00' },
    { ESPACIOS_HORA_APERTURA: '07:00', ESPACIOS_HORA_CIERRE: '07:00' },
    { ESPACIOS_HORA_APERTURA: '7:00' },
    { ESPACIOS_HORA_CIERRE: '24:00' },
    { ESPACIOS_ZONA_HORARIA: 'Zona/Inexistente' },
  ])('rechaza configuración inválida %j', (config) => {
    expect(() => makeService(config)).toThrow(
      'Configuración de espacios inválida',
    );
  });

  it('rechaza horas inexistentes por un cambio de horario', async () => {
    service = makeService({
      ESPACIOS_ZONA_HORARIA: 'America/New_York',
      ESPACIOS_HORA_APERTURA: '02:30',
    });
    await expect(service.verDisponibilidad(1, '2026-03-08')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza horas ambiguas por un cambio de horario', async () => {
    service = makeService({
      ESPACIOS_ZONA_HORARIA: 'America/New_York',
      ESPACIOS_HORA_APERTURA: '01:30',
    });
    await expect(service.verDisponibilidad(1, '2026-11-01')).rejects.toThrow(
      BadRequestException,
    );
  });
});
