import { context } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Prisma } from '../generated/prisma/client';

export type ReservationEvent =
  'reserva.creada' | 'reserva.cancelada' | 'reserva.traslape';

export function reservationTrace(
  event: ReservationEvent,
  attributes: {
    espacioId: number;
    usuarioId: number;
    reservaId?: number;
    actorId?: number;
  },
): void {
  // The API is a no-op when Azure Monitor has not registered a log provider.
  logs.getLogger('sistema-reservas.negocio').emit({
    context: context.active(),
    body: event,
    severityNumber:
      event === 'reserva.traslape' ? SeverityNumber.WARN : SeverityNumber.INFO,
    attributes: { event, ...attributes },
  });
}

export function serverException(
  status: number,
  method: string,
  route: string,
  exception: unknown,
): void {
  const type =
    exception instanceof Error ? exception.constructor.name : 'UnknownError';
  const code =
    exception instanceof Prisma.PrismaClientKnownRequestError
      ? exception.code
      : exception instanceof Prisma.PrismaClientInitializationError
        ? exception.errorCode
        : undefined;
  logs.getLogger('sistema-reservas.errores').emit({
    context: context.active(),
    body: 'api.error_5xx',
    severityNumber: SeverityNumber.ERROR,
    attributes: {
      event: 'api.error_5xx',
      'http.response.status_code': status,
      'http.request.method': method,
      'http.route': route,
      'exception.type': type,
      ...(code ? { 'exception.code': code } : {}),
      'exception.message': 'Error interno de la API',
      // Full diagnostics are retained in private server logs, not telemetry.
      'exception.stacktrace': `${type}: Error interno de la API\n    at GlobalExceptionFilter.catch (api)`,
    },
  });
}
