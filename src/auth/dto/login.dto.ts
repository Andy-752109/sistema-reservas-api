import { Transform } from 'class-transformer';
import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  @IsByteLength(1, 72)
  contrasena!: string;
}
