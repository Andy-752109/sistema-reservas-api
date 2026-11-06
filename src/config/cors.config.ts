import { ForbiddenException } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsOptions(config: ConfigService): CorsOptions {
  const origins = new Set<string>();
  for (const value of config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)) {
    try {
      const url = new URL(value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.pathname !== '/' ||
        url.search ||
        url.hash ||
        url.username ||
        url.password
      )
        throw new Error();
      origins.add(url.origin);
    } catch {
      throw new Error(
        'CORS_ORIGINS debe contener orígenes HTTP(S) separados por comas, sin rutas, comodines ni credenciales.',
      );
    }
  }
  return {
    origin: (origin, callback) => {
      if (!origin || origins.has(origin)) callback(null, true);
      else
        callback(new ForbiddenException('Origen no permitido por CORS'), false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  };
}
