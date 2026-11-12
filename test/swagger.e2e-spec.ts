import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  OpenAPIObject,
  ResponseObject,
  SchemaObject,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupSwagger } from '../src/swagger';

describe('Swagger/OpenAPI (sin PostgreSQL)', () => {
  let app: INestApplication<App>;
  let document: OpenAPIObject;
  const schema = (name: string) =>
    document.components?.schemas?.[name] as SchemaObject;

  beforeAll(async () => {
    const values: Record<string, string> = {
      JWT_SECRET: 'secreto-exclusivo-de-prueba-openapi',
      JWT_EXPIRES_IN: '1h',
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
      .useValue({})
      .overrideProvider(ConfigService)
      .useValue(config)
      .compile();
    app = module.createNestApplication();
    setupSwagger(app);
    await app.init();
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    document = response.body as OpenAPIObject;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('sirve Swagger UI, su script de inicialización y el documento YAML', async () => {
    const ui = await request(app.getHttpServer()).get('/api/docs/').expect(200);
    expect(ui.text).toContain('swagger-ui');
    const init = await request(app.getHttpServer())
      .get('/api/docs/swagger-ui-init.js')
      .expect(200);
    expect(init.text).toContain('SwaggerUIBundle');
    await request(app.getHttpServer()).get('/api/docs-yaml').expect(200);
  });

  it('declara Bearer JWT y los cuatro tags de negocio', () => {
    expect(document.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(document.tags?.map((tag) => tag.name)).toEqual(
      expect.arrayContaining(['auth', 'usuarios', 'espacios', 'reservas']),
    );
    expect(document.paths['/login'].post?.tags).toEqual(['auth']);
    expect(document.paths['/usuarios'].post?.tags).toEqual(['usuarios']);
    expect(document.paths['/espacios'].get?.tags).toEqual(['espacios']);
    expect(document.paths['/reservas'].get?.tags).toEqual(['reservas']);
  });

  it('documenta autenticación en cada ruta protegida y conserva públicas las consultas y el registro', () => {
    expect(document.paths['/login'].post?.security ?? []).toEqual([]);
    expect(document.paths['/usuarios'].post?.security ?? []).toEqual([]);
    expect(document.paths['/espacios'].get?.security ?? []).toEqual([]);
    expect(
      document.paths['/espacios/{id}/disponibilidad'].get?.security ?? [],
    ).toEqual([]);
    for (const operation of [
      document.paths['/usuarios'].get,
      document.paths['/usuarios/{id}'].get,
      document.paths['/usuarios/{id}'].patch,
      document.paths['/usuarios/{id}'].delete,
      document.paths['/espacios'].post,
      document.paths['/espacios/{id}'].put,
      document.paths['/espacios/{id}'].delete,
      document.paths['/reservas'].get,
      document.paths['/reservas'].post,
      document.paths['/reservas/{id}'].put,
      document.paths['/reservas/{id}'].delete,
    ]) {
      expect(operation?.security).toEqual([{ bearer: [] }]);
      expect(operation?.responses['401']).toBeDefined();
    }
  });

  it('expone ejemplos, campos obligatorios y opcionales y contraseñas solo de escritura', () => {
    expect(schema('CrearUsuarioDto').required).toEqual(
      expect.arrayContaining(['nombre', 'correo', 'contrasena']),
    );
    expect(schema('CrearUsuarioDto').properties?.rol).toBeUndefined();
    expect(schema('CrearUsuarioDto').properties?.contrasena).toMatchObject({
      writeOnly: true,
      format: 'password',
      minLength: 8,
    });
    expect(schema('ActualizarUsuarioDto').required ?? []).toEqual([]);
    expect(schema('CrearEspacioDto').required).toEqual(
      expect.arrayContaining(['nombre', 'tipo', 'capacidad', 'ubicacion']),
    );
    expect(schema('CrearEspacioDto').required).not.toContain('activo');
    expect(schema('GuardarReservaDto').required).toEqual(
      expect.arrayContaining(['espacioId', 'inicio', 'fin']),
    );
    expect(schema('GuardarReservaDto').properties?.inicio).toMatchObject({
      format: 'date-time',
      example: '2026-11-10T09:00:00-06:00',
    });
  });

  it('documenta modelos de respuesta sin hashes y respuestas sin cuerpo, conflictos y cancelación', () => {
    expect(schema('UsuarioResponseDto').properties?.contrasena).toBeUndefined();
    expect(schema('ReservaResponseDto').properties?.contrasena).toBeUndefined();
    expect(schema('UsuarioResponseDto').required).toContain('id');
    expect(
      document.paths['/usuarios/{id}'].delete?.responses['204'],
    ).toBeDefined();
    expect(
      document.paths['/usuarios/{id}'].delete?.responses['200'],
    ).toBeUndefined();
    expect(document.paths['/reservas'].post?.responses['409']).toBeDefined();
    const cancellation = document.paths['/reservas/{id}'].delete?.responses[
      '200'
    ] as ResponseObject;
    expect(cancellation.content?.['application/json'].example).toMatchObject({
      estado: 'CANCELADA',
    });
    expect(
      document.paths['/reservas/{id}'].delete?.responses['200'],
    ).toBeDefined();
    expect(
      document.paths['/espacios/{id}'].delete?.responses['200'],
    ).toBeDefined();
    expect(
      schema('DisponibilidadResponseDto').properties?.bloquesLibres,
    ).toMatchObject({ type: 'array' });
    expect(JSON.stringify(document)).not.toContain(
      'secreto-exclusivo-de-prueba-openapi',
    );
  });

  it('documenta los parámetros de fecha obligatoria y tipo opcional', () => {
    expect(
      document.paths['/espacios/{id}/disponibilidad'].get?.parameters,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'fecha', in: 'query', required: true }),
        expect.objectContaining({ name: 'id', in: 'path', required: true }),
      ]),
    );
    expect(document.paths['/espacios'].get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'tipo', in: 'query', required: false }),
      ]),
    );
  });

  it('mantiene los guards activos aunque la documentación sea pública', async () => {
    await request(app.getHttpServer()).get('/reservas').expect(401);
    await request(app.getHttpServer()).get('/usuarios').expect(401);
  });
});
