import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { createCorsOptions } from './config/cors.config';

export async function startApplication(
  shutdownTelemetry?: () => Promise<void>,
) {
  const app = await NestFactory.create(AppModule);
  if (shutdownTelemetry) {
    app.get(AppModule).shutdownTelemetry = shutdownTelemetry;
  }
  app.enableShutdownHooks();
  const config = app.get(ConfigService);
  app.enableCors(createCorsOptions(config));
  setupSwagger(app);
  await app.listen(Number(config.get<string>('PORT') ?? 3000));
  return app;
}
