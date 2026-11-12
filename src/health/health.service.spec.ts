import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const query = jest.fn();
  const get = jest.fn();
  const version = '0123456789abcdef0123456789abcdef01234567';
  let service: HealthService;

  beforeEach(() => {
    jest.resetAllMocks();
    get.mockImplementation((_key: string, fallback: string) => fallback);
    query.mockResolvedValue([{ result: 1 }]);
    service = new HealthService(
      { $queryRaw: query } as unknown as PrismaService,
      { get } as unknown as ConfigService,
    );
  });

  it('consulta PostgreSQL e informa el SHA configurado', async () => {
    get.mockReturnValue(` ${version} `);
    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      version,
      database: 'up',
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('devuelve 503 sin filtrar diagnósticos de la base', async () => {
    get.mockReturnValue(version);
    query.mockRejectedValue(
      new Error('postgresql://usuario:secreto@servidor/base'),
    );
    const error = await service.check().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    const exception = error as ServiceUnavailableException;
    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual({
      status: 'error',
      version,
      database: 'down',
    });
    expect(JSON.stringify(exception.getResponse())).not.toContain('secreto');
  });

  it('identifica desarrollo cuando no se configura el SHA', async () => {
    await expect(service.check()).resolves.toMatchObject({
      version: 'development',
    });
  });

  it('identifica desarrollo si el SHA está vacío', async () => {
    get.mockReturnValue('   ');
    await expect(service.check()).resolves.toMatchObject({
      version: 'development',
    });
  });
});
