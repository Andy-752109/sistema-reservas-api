import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';
import { serverException } from './business-telemetry';

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500 && status <= 599) {
      // Preserve the diagnostic in private container logs before sanitizing the
      // HTTP response. Azure telemetry receives only the type and Prisma code.
      this.logger.error(
        exception instanceof Error
          ? { name: exception.name, message: exception.message }
          : exception,
        exception instanceof Error ? exception.stack : undefined,
      );
      const request = host.switchToHttp().getRequest<Request>();
      const route = request.route as { path?: unknown } | undefined;
      serverException(
        status,
        request.method,
        typeof route?.path === 'string' ? route.path : 'unmatched',
        exception,
      );
      // Keep the existing, deliberately sanitized health-check contract.
      if (
        request.method === 'GET' &&
        route?.path === '/health' &&
        status === 503 &&
        exception instanceof HttpException
      ) {
        const body: unknown = exception.getResponse();
        if (
          typeof body === 'object' &&
          body !== null &&
          'status' in body &&
          body.status === 'error' &&
          'database' in body &&
          body.database === 'down' &&
          'version' in body &&
          typeof body.version === 'string'
        ) {
          super.catch(
            new HttpException(
              { status: 'error', database: 'down', version: body.version },
              503,
            ),
            host,
          );
          return;
        }
      }
      // Preserve the status while keeping internal details out of the response.
      super.catch(new HttpException('Internal server error', status), host);
      return;
    }
    super.catch(exception, host);
  }
}
