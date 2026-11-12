import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({
    example: 'Nombre actualizado',
    minLength: 1,
    maxLength: 100,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({
    example: 'nuevo@example.com',
    format: 'email',
    maxLength: 254,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  correo?: string;

  @ApiPropertyOptional({
    example: 'OtraClaveDeEjemplo123!',
    minLength: 8,
    format: 'password',
    writeOnly: true,
    description:
      'Máximo 72 bytes UTF-8. Cambiar la contraseña conserva la expiración de los tokens ya emitidos.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  contrasena?: string;

  @ApiPropertyOptional({
    enum: Rol,
    enumName: 'Rol',
    example: Rol.DOCENTE,
    description: 'Solo ADMIN puede cambiar roles.',
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(Rol)
  rol?: Rol;
}
