import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  INestApplication,
  Logger,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { logs, LogRecord, SeverityNumber } from '@opentelemetry/api-logs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Prisma } from '../src/generated/prisma/client';

@Controller('observability-test')
class ErrorController {
  @Get('unknown/:id')
  unknown() {
    throw new Error('secret-password SQL SELECT token');
  }

  @Get('unavailable')
  unavailable() {
    throw new HttpException('secret-connection-string', 503);
  }

  @Get('invalid')
  invalid() {
    throw new BadRequestException('Entrada invalida');
  }

  @Get('prisma')
  prisma() {
    throw new Prisma.PrismaClientKnownRequestError('private-database-details', {
      code: 'P1001',
      clientVersion: '7.10.1',
    });
  }

  @Get('initialization')
  initialization() {
    throw new Prisma.PrismaClientInitializationError(
      'private-init-details',
      '7.10.1',
      'P1000',
    );
  }
}

describe('Global exception filter', () => {
  let app: INestApplication<App>;
  const emit = jest.fn<void, [LogRecord]>();
  let serverLog: jest.SpyInstance;

  beforeAll(async () => {
    serverLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    jest
      .spyOn(logs, 'getLogger')
      .mockReturnValue({ emit, enabled: () => true });
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ErrorController],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    emit.mockClear();
    serverLog.mockClear();
  });
  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('registers an unknown exception once and excludes raw input, query, headers and stack', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/unknown/private-id?token=secret-query')
      .set('Authorization', 'Bearer secret-header')
      .expect(500);
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit.mock.calls[0][0]).toMatchObject({
      severityNumber: SeverityNumber.ERROR,
      attributes: {
        'http.route': '/observability-test/unknown/:id',
        'http.response.status_code': 500,
        'exception.type': 'Error',
      },
    });
    const output = JSON.stringify(emit.mock.calls);
    for (const secret of [
      'secret-password',
      'SELECT',
      'private-id',
      'secret-query',
      'secret-header',
    ])
      expect(output).not.toContain(secret);
    expect(serverLog).toHaveBeenCalledTimes(1);
    expect(serverLog).toHaveBeenCalledWith(
      { name: 'Error', message: 'secret-password SQL SELECT token' },
      expect.stringContaining('Error: secret-password SQL SELECT token'),
    );
  });

  it('registers explicit 503 and preserves its status with a sanitized response', async () => {
    await request(app.getHttpServer())
      .get('/observability-test/unavailable')
      .expect(503)
      .expect({ statusCode: 503, message: 'Internal server error' });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(serverLog).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(emit.mock.calls)).not.toContain(
      'secret-connection-string',
    );
  });

  it.each([
    ['prisma', 'PrismaClientKnownRequestError', 'P1001'],
    ['initialization', 'PrismaClientInitializationError', 'P1000'],
  ])(
    'exports the type/code of %s without database diagnostics',
    async (route, type, code) => {
      const response = await request(app.getHttpServer())
        .get('/observability-test/' + route)
        .expect(500);
      expect(response.body).toMatchObject({ message: 'Internal server error' });
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit.mock.calls[0][0].attributes).toMatchObject({
        'exception.type': type,
        'exception.code': code,
      });
      expect(JSON.stringify(emit.mock.calls)).not.toContain('private-');
      expect(serverLog).toHaveBeenCalledTimes(1);
    },
  );

  it('preserves a 400 validation response without reporting a server exception', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/invalid')
      .expect(400);
    expect(response.body).toMatchObject({ message: 'Entrada invalida' });
    expect(emit).not.toHaveBeenCalled();
    expect(serverLog).not.toHaveBeenCalled();
  });

  it('keeps unmatched routes as 404 without reporting an exception', async () => {
    await request(app.getHttpServer())
      .get('/missing-observability-route')
      .expect(404);
    expect(emit).not.toHaveBeenCalled();
    expect(serverLog).not.toHaveBeenCalled();
  });
});
