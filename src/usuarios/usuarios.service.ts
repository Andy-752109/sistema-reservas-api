import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../auth/auth-user';
import { Prisma } from '../generated/prisma/client';
import { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

const publicSelect = {
  id: true,
  nombre: true,
  correo: true,
  rol: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto) {
    const contrasena = await bcrypt.hash(dto.contrasena, 12);
    try {
      return await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre,
          correo: dto.correo,
          contrasena,
          rol: Rol.ESTUDIANTE,
        },
        select: publicSelect,
      });
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  listar() {
    return this.prisma.usuario.findMany({
      select: publicSelect,
      orderBy: { id: 'asc' },
    });
  }

  async consultar(id: number, actor: AuthUser) {
    this.checkOwner(id, actor);
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: publicSelect,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async actualizar(id: number, dto: ActualizarUsuarioDto, actor: AuthUser) {
    this.checkOwner(id, actor);
    if (dto.rol !== undefined && actor.rol !== Rol.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede cambiar roles');
    }
    const data: Prisma.UsuarioUpdateInput = {
      nombre: dto.nombre,
      correo: dto.correo,
      rol: dto.rol,
    };
    if (dto.contrasena !== undefined)
      data.contrasena = await bcrypt.hash(dto.contrasena, 12);
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data,
        select: publicSelect,
      });
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async eliminar(id: number) {
    try {
      await this.prisma.usuario.delete({ where: { id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'No se puede eliminar un usuario con reservas; se conserva su historial',
        );
      }
      this.handleError(error);
    }
  }

  private checkOwner(id: number, actor: AuthUser): void {
    if (actor.rol !== Rol.ADMIN && actor.id !== id) {
      throw new ForbiddenException('No tienes acceso a este usuario');
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictException('El correo ya está registrado');
      if (error.code === 'P2025')
        throw new NotFoundException('Usuario no encontrado');
    }
    throw error;
  }
}
