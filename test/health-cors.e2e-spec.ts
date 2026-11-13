import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { createCorsOptions } from '../src/config/cors.config';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupSwagger } from '../src/swagger';
import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Health y CORS (HTTP sin PostgreSQL)', () => {
  let app: INestApplication<App>;
  const query = jest.fn();
  const version = '0123456789abcdef0123456789abcdef01234567';
  const origin = 'https://web.example.com';
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const values: Record<string, string> = {
      JWT_SECRET: 'solo-para-pruebas-health',
      JWT_EXPIRES_IN: '1h',
      COMMIT_SHA: version,
      CORS_ORIGINS: `${origin},${parse(readFileSync(join(__dirname, '../.env.example'))).CORS_ORIGINS}`,
    };
    const config = {
      get: (key: string, fallback?: string) => values[key] ?? fallback,
      getOrThrow: (key: string) => {
        if (!values[key]) throw new Error(`Variable de prueba ausente: ${key}`);
        return values[key];
      },
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: query })
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();
    app = module.createNestApplication();
    app.enableCors(createCorsOptions(app.get(ConfigService)));
    setupSwagger(app);
    await app.init();
  });

  beforeEach(() => {
    query.mockReset().mockResolvedValue([{ result: 1 }]);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('responde 200 con SHA y DB up sin autenticación ni caché', async () => {
    const response = await api().get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', version, database: 'up' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde 503 y DB down sin exponer la excepción interna', async () => {
    query.mockRejectedValue(new Error('detalle-interno-no-publico'));
    const response = await api().get('/health').expect(503);
    expect(response.body).toEqual({
      status: 'error',
      version,
      database: 'down',
    });
    expect(response.text).not.toContain('detalle-interno');
  });

  it.each([origin, 'http://localhost:5173', 'http://localhost:3000'])(
    'permite el origen configurado %s',
    async (value) => {
      const response = await api()
        .get('/health')
        .set('Origin', value)
        .expect(200);
      expect(response.headers['access-control-allow-origin']).toBe(value);
      expect(response.headers.vary).toContain('Origin');
      expect(
        response.headers['access-control-allow-credentials'],
      ).toBeUndefined();
    },
  );

  it('allows the local Swagger POST origin through to request validation', async () => {
    const response = await api()
      .post('/login')
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(400);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('acepta preflight para Authorization y Content-Type', async () => {
    const response = await api()
      .options('/reservas')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type')
      .expect(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(
      String(response.headers['access-control-allow-headers']).toLowerCase(),
    ).toContain('authorization');
    expect(String(response.headers['access-control-allow-methods'])).toContain(
      'POST',
    );
  });

  it('rechaza orígenes no permitidos y su preflight con 403', async () => {
    const response = await api()
      .get('/health')
      .set('Origin', 'https://ajeno.example.com')
      .expect(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    await api()
      .options('/reservas')
      .set('Origin', 'https://ajeno.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(403);
    expect(query).not.toHaveBeenCalled();
  });

  it('conserva el guard JWT para orígenes permitidos', async () => {
    const response = await api()
      .get('/reservas')
      .set('Origin', origin)
      .expect(401);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('publica el contrato de health en Swagger', async () => {
    const response = await api().get('/api/docs-json').expect(200);
    const document = response.body as OpenAPIObject;
    const operation = document.paths['/health'].get;
    expect(operation?.tags).toEqual(['sistema']);
    expect(operation?.responses['200']).toBeDefined();
    expect(operation?.responses['503']).toBeDefined();
    expect(operation?.security ?? []).toEqual([]);
  });
});
