import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'estudiante@example.com',
    format: 'email',
    description: 'Correo registrado; se recorta y normaliza a minúsculas.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  correo!: string;

  @ApiProperty({
    example: 'UnaClaveDeEjemplo123!',
    format: 'password',
    writeOnly: true,
    description: 'Contraseña registrada, máximo 72 bytes UTF-8.',
  })
  @IsString()
  @IsNotEmpty()
  @IsByteLength(1, 72)
  contrasena!: string;
}
