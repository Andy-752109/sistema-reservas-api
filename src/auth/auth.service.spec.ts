import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const findUnique = jest.fn();
  const signAsync = jest.fn();
  let contrasena: string;

  beforeAll(async () => {
    contrasena = await bcrypt.hash('ClaveSegura123!', 10);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { usuario: { findUnique } } },
        { provide: JwtService, useValue: { signAsync } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('firma únicamente sub y rol cuando la contraseña coincide con bcrypt', async () => {
    findUnique.mockResolvedValue({ id: 7, rol: Rol.DOCENTE, contrasena });
    signAsync.mockResolvedValue('jwt-de-prueba');

    await expect(
      service.login({
        correo: 'docente@example.com',
        contrasena: 'ClaveSegura123!',
      }),
    ).resolves.toEqual({ access_token: 'jwt-de-prueba' });
    expect(signAsync).toHaveBeenCalledWith({ sub: 7, rol: Rol.DOCENTE });
  });

  it('rechaza una contraseña incorrecta sin emitir un token', async () => {
    findUnique.mockResolvedValue({ id: 7, rol: Rol.ESTUDIANTE, contrasena });

    await expect(
      service.login({
        correo: 'usuario@example.com',
        contrasena: 'Incorrecta123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('rechaza un correo inexistente con el mismo error de credenciales', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        correo: 'ausente@example.com',
        contrasena: 'ClaveSegura123!',
      }),
    ).rejects.toThrow('Credenciales incorrectas');
    expect(signAsync).not.toHaveBeenCalled();
  });
});
