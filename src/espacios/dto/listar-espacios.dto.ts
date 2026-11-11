import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class ListarEspaciosDto {
  @ApiPropertyOptional({
    example: 'CUBICULO',
    minLength: 1,
    maxLength: 50,
    description: 'Filtro exacto por tipo; se recorta y normaliza a mayúsculas.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  tipo?: string;
}
