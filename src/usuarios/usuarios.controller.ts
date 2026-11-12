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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors, ApiIdParam } from '../common/api-docs.decorators';
import { UsuarioResponseDto } from '../common/dto/api-responses.dto';

@Controller('usuarios')
@ApiTags('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un estudiante',
    description:
      'Público. Siempre crea ESTUDIANTE y devuelve un perfil sin contraseña ni hash.',
  })
  @ApiCreatedResponse({ type: UsuarioResponseDto })
  @ApiErrors(400, 409)
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuarios.crear(dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Solo ADMIN. Devuelve perfiles sin hashes.',
  })
  @ApiOkResponse({ type: [UsuarioResponseDto] })
  @ApiErrors(401, 403)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  listar() {
    return this.usuarios.listar();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiIdParam()
  @ApiOperation({
    summary: 'Consultar un usuario',
    description: 'ADMIN o el propio usuario.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrors(400, 401, 403, 404)
  @UseGuards(JwtAuthGuard)
  consultar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.usuarios.consultar(id, req.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiIdParam()
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description:
      'ADMIN o el propio usuario. Todos los campos son opcionales; solo ADMIN puede cambiar rol. Los valores null son inválidos.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiErrors(400, 401, 403, 404, 409)
  @UseGuards(JwtAuthGuard)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @Req() req: AuthRequest,
  ) {
    return this.usuarios.actualizar(id, dto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiIdParam()
  @ApiOperation({
    summary: 'Eliminar un usuario',
    description:
      'Solo ADMIN. Sus tokens dejan de ser válidos. Las reservas del usuario se eliminan en cascada conforme al modelo actual.',
  })
  @ApiNoContentResponse({
    description: 'Usuario eliminado; respuesta sin cuerpo.',
  })
  @ApiErrors(400, 401, 403, 404)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.eliminar(id);
  }
}
