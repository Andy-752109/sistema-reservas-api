import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Sistema de Reservas de Espacios Universitarios')
    .setDescription(
      'API de usuarios, espacios y reservas. Obtén access_token en POST /login y pégalo en Authorize para usar las rutas protegidas. Los permisos se verifican con el rol vigente del usuario.',
    )
    .setVersion('0.0.1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addTag('auth', 'Inicio de sesión')
    .addTag('usuarios', 'Registro y gestión de perfiles')
    .addTag('espacios', 'Catálogo y disponibilidad')
    .addTag('reservas', 'Reservas y cancelaciones')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    yamlDocumentUrl: 'api/docs-yaml',
  });
  return document;
}
