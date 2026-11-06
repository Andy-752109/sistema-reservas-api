import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { logs, LogRecord, SeverityNumber } from '@opentelemetry/api-logs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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
}

describe('Global exception filter', () => {
  let app: INestApplication<App>;
  const emit = jest.fn<void, [LogRecord]>();

  beforeAll(async () => {
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
  beforeEach(() => emit.mockClear());
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
        'exception.type': 'InternalServerError',
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
  });

  it('registers explicit 503 and preserves its status with a sanitized response', async () => {
    await request(app.getHttpServer())
      .get('/observability-test/unavailable')
      .expect(503)
      .expect({ statusCode: 503, message: 'Internal server error' });
    expect(emit).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(emit.mock.calls)).not.toContain(
      'secret-connection-string',
    );
  });

  it('preserves a 400 validation response without reporting a server exception', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/invalid')
      .expect(400);
    expect(response.body).toMatchObject({ message: 'Entrada invalida' });
    expect(emit).not.toHaveBeenCalled();
  });

  it('keeps unmatched routes as 404 without reporting an exception', async () => {
    await request(app.getHttpServer())
      .get('/missing-observability-route')
      .expect(404);
    expect(emit).not.toHaveBeenCalled();
  });
});
