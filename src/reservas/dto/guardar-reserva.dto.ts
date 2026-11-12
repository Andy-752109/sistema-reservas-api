import { IsInt, IsISO8601, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardarReservaDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: 2147483647,
    description: 'Espacio activo a reservar.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  espacioId!: number;

  @ApiProperty({
    example: '2026-11-10T09:00:00-06:00',
    format: 'date-time',
    description:
      'ISO 8601 con Z u offset explícito, máximo tres decimales; inicio incluido y anterior a fin.',
  })
  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  inicio!: string;

  @ApiProperty({
    example: '2026-11-10T10:00:00-06:00',
    format: 'date-time',
    description: 'Fin excluido. Las reservas contiguas están permitidas.',
  })
  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  fin!: string;
}
