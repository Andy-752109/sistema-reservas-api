import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisponibilidadDto {
  @ApiProperty({
    example: '2026-11-10',
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    description:
      'Fecha real YYYY-MM-DD, interpretada en ESPACIOS_ZONA_HORARIA.',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha!: string;
}
