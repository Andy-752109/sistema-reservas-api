import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuarios.crear(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  listar() {
    return this.usuarios.listar();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  consultar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.usuarios.consultar(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @Req() req: AuthRequest,
  ) {
    return this.usuarios.actualizar(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.eliminar(id);
  }
}
