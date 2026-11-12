import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoReserva, Rol } from '../../generated/prisma/enums';

export class UsuarioResponseDto {
  @ApiProperty({ example: 1, minimum: 1, type: 'integer' })
  id!: number;
  @ApiProperty({ example: 'Estudiante de ejemplo' })
  nombre!: string;
  @ApiProperty({ example: 'estudiante@example.com', format: 'email' })
  correo!: string;
  @ApiProperty({ enum: Rol, enumName: 'Rol', example: Rol.ESTUDIANTE })
  rol!: Rol;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  creadoEn!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  actualizadoEn!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description:
      'JWT firmado con sub, rol, iat y exp. Copia el valor en Authorize, sin escribir el prefijo Bearer.',
    example: 'eyJ...token-de-ejemplo...firma',
  })
  access_token!: string;
}

export class EspacioResponseDto {
  @ApiProperty({ example: 1, minimum: 1, type: 'integer' })
  id!: number;
  @ApiProperty({ example: 'Cubículo Biblioteca 1' })
  nombre!: string;
  @ApiProperty({ example: 'CUBICULO' })
  tipo!: string;
  @ApiProperty({ example: 4, minimum: 1, type: 'integer' })
  capacidad!: number;
  @ApiProperty({ example: 'Biblioteca, planta baja' })
  ubicacion!: string;
  @ApiProperty({ example: true })
  activo!: boolean;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  creadoEn!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  actualizadoEn!: string;
}

export class BloqueHorarioDto {
  @ApiProperty({
    format: 'date-time',
    example: '2026-11-10T07:00:00.000-06:00',
    description: 'Inicio incluido, con offset de la zona configurada.',
  })
  inicio!: string;
  @ApiProperty({
    format: 'date-time',
    example: '2026-11-10T21:00:00.000-06:00',
    description: 'Fin excluido.',
  })
  fin!: string;
}

export class DisponibilidadResponseDto {
  @ApiProperty({ example: 1, type: 'integer' })
  espacioId!: number;
  @ApiProperty({ example: '2026-11-10', format: 'date' })
  fecha!: string;
  @ApiProperty({ example: 'America/Mexico_City' })
  zonaHoraria!: string;
  @ApiProperty({ type: BloqueHorarioDto })
  horario!: BloqueHorarioDto;
  @ApiProperty({
    type: [BloqueHorarioDto],
    description:
      'Intervalos continuos máximos libres. Un arreglo vacío indica que todo el horario está ocupado. Descuenta solo reservas ACTIVAS.',
  })
  bloquesLibres!: BloqueHorarioDto[];
}

export class EliminarEspacioResponseDto {
  @ApiProperty({ example: 1, type: 'integer' })
  id!: number;
  @ApiProperty({
    enum: ['eliminado', 'desactivado'],
    example: 'desactivado',
    description:
      'Con cualquier reserva, conserva el espacio y el historial y lo desactiva.',
  })
  accion!: 'eliminado' | 'desactivado';
}

export class ReservaResponseDto {
  @ApiProperty({ example: 1, type: 'integer' })
  id!: number;
  @ApiProperty({ example: 1, type: 'integer' })
  usuarioId!: number;
  @ApiProperty({ example: 1, type: 'integer' })
  espacioId!: number;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  inicio!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T16:00:00.000Z' })
  fin!: string;
  @ApiProperty({
    enum: EstadoReserva,
    enumName: 'EstadoReserva',
    example: EstadoReserva.ACTIVA,
  })
  estado!: EstadoReserva;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  creadoEn!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-10T15:00:00.000Z' })
  actualizadoEn!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: 'integer', description: 'Código HTTP de la respuesta.' })
  statusCode!: number;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    description: 'Descripción del error o lista de errores de validación.',
  })
  message!: string | string[];
  @ApiPropertyOptional({
    description: 'Nombre del error HTTP, cuando está presente.',
  })
  error?: string;
}
