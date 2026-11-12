import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
      select: { id: true, rol: true, contrasena: true },
    });
    if (
      !usuario ||
      !(await bcrypt.compare(dto.contrasena, usuario.contrasena))
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    return {
      access_token: await this.jwt.signAsync({
        sub: usuario.id,
        rol: usuario.rol,
      }),
    };
  }
}
