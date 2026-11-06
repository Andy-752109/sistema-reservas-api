import { context } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

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
): void {
  logs.getLogger('sistema-reservas.errores').emit({
    context: context.active(),
    body: 'api.error_5xx',
    severityNumber: SeverityNumber.ERROR,
    attributes: {
      event: 'api.error_5xx',
      'http.response.status_code': status,
      'http.request.method': method,
      'http.route': route,
      'exception.type': 'InternalServerError',
      'exception.message': 'Error interno de la API',
      // Never include the original message/stack: driver errors can contain SQL,
      // credentials or user input. This marker identifies the reporting boundary.
      'exception.stacktrace':
        'InternalServerError: Error interno de la API\n    at GlobalExceptionFilter.catch (api)',
    },
  });
}
