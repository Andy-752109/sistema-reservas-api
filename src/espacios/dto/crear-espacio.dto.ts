import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CrearEspacioDto {
  @ApiProperty({
    example: 'Cubículo Biblioteca 1',
    minLength: 1,
    maxLength: 120,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({
    example: 'CUBICULO',
    minLength: 1,
    maxLength: 50,
    description:
      'Tipo libre, normalizado a mayúsculas; por ejemplo CUBICULO, LABORATORIO o CANCHA.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  tipo!: string;

  @ApiProperty({ type: 'integer', example: 4, minimum: 1, maximum: 2147483647 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  capacidad!: number;

  @ApiProperty({
    example: 'Biblioteca, planta baja',
    minLength: 1,
    maxLength: 200,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ubicacion!: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'En POST se crea activo si se omite. En PUT, omitirlo conserva el valor existente.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  activo?: boolean;
}
