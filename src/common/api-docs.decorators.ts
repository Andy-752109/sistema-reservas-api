import { applyDecorators } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from './dto/api-responses.dto';

const errors = {
  400: 'Datos, parámetros o intervalo inválidos; también espacio inactivo al reservar.',
  401: 'Falta un token válido o las credenciales son incorrectas.',
  403: 'El usuario no tiene el rol requerido ni es propietario del recurso.',
  404: 'Recurso inexistente; los espacios inactivos tampoco se exponen públicamente.',
  409: 'Correo/nombre duplicado, traslape de reservas o modificación de una reserva no ACTIVA.',
};

export const ApiErrors = (...statuses: (keyof typeof errors)[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: errors[status],
        type: ApiErrorResponseDto,
      }),
    ),
  );

export const ApiIdParam = () =>
  ApiParam({
    name: 'id',
    description: 'Identificador entero positivo.',
    schema: { type: 'integer', minimum: 1, maximum: 2147483647 },
    example: 1,
  });
