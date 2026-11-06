import { Test, TestingModule } from '@nestjs/testing';
import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

class ValidationTestDto {
  @IsString()
  nombre!: string;
}

@Controller('validation-test')
class ValidationTestController {
  @Post()
  create(@Body() body: ValidationTestDto) {
    return body;
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('elimina propiedades sin decoradores mediante el ValidationPipe global', () => {
    return request(app.getHttpServer())
      .post('/validation-test')
      .send({ nombre: 'Ramiro', rol: 'ADMIN' })
      .expect(201)
      .expect({ nombre: 'Ramiro' });
  });

  it('rechaza valores que no cumplen la validación del DTO', () => {
    return request(app.getHttpServer())
      .post('/validation-test')
      .send({ nombre: 123 })
      .expect(400);
  });
});
