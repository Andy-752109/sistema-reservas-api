import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
  @ApiProperty({
    example: 'Estudiante de ejemplo',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({
    example: 'estudiante@example.com',
    format: 'email',
    maxLength: 254,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  correo!: string;

  @ApiProperty({
    example: 'UnaClaveDeEjemplo123!',
    minLength: 8,
    format: 'password',
    writeOnly: true,
    description:
      'Mínimo 8 caracteres y máximo 72 bytes UTF-8. El registro siempre crea ESTUDIANTE.',
  })
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  contrasena!: string;
}
