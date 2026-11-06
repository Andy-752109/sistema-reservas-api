import { Transform } from 'class-transformer';
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
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  correo?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  contrasena?: string;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsEnum(Rol)
  rol?: Rol;
}
