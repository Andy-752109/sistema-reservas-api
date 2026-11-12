import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { CrearEspacioDto } from './dto/crear-espacio.dto';
import { DisponibilidadDto } from './dto/disponibilidad.dto';
import { ListarEspaciosDto } from './dto/listar-espacios.dto';
import { EspaciosService } from './espacios.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors, ApiIdParam } from '../common/api-docs.decorators';
import {
  DisponibilidadResponseDto,
  EliminarEspacioResponseDto,
  EspacioResponseDto,
} from '../common/dto/api-responses.dto';

@Controller('espacios')
@ApiTags('espacios')
export class EspaciosController {
  constructor(private readonly espacios: EspaciosService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar espacios activos',
    description: 'Consulta pública; acepta un filtro opcional por tipo.',
  })
  @ApiOkResponse({ type: [EspacioResponseDto] })
  @ApiErrors(400)
  listar(@Query() query: ListarEspaciosDto) {
    return this.espacios.listar(query.tipo);
  }

  @Get(':id/disponibilidad')
  @ApiIdParam()
  @ApiOperation({
    summary: 'Consultar bloques libres por fecha',
    description:
      'Consulta pública. Descuenta solo reservas ACTIVAS dentro del horario configurado (07:00–21:00, America/Mexico_City por defecto). Devuelve intervalos máximos [inicio, fin), con offset, sin datos privados de reservas.',
  })
  @ApiOkResponse({ type: DisponibilidadResponseDto })
  @ApiErrors(400, 404)
  verDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: DisponibilidadDto,
  ) {
    return this.espacios.verDisponibilidad(id, query.fecha);
  }

  @Get(':id')
  @ApiIdParam()
  @ApiOperation({
    summary: 'Consultar un espacio activo',
    description: 'Consulta pública; los inactivos reciben 404.',
  })
  @ApiOkResponse({ type: EspacioResponseDto })
  @ApiErrors(400, 404)
  consultar(@Param('id', ParseIntPipe) id: number) {
    return this.espacios.consultar(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un espacio', description: 'Solo ADMIN.' })
  @ApiCreatedResponse({ type: EspacioResponseDto })
  @ApiErrors(400, 401, 403, 409)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  crear(@Body() dto: CrearEspacioDto) {
    return this.espacios.crear(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiIdParam()
  @ApiOperation({
    summary: 'Actualizar o reactivar un espacio',
    description:
      'Solo ADMIN. Requiere nombre, tipo, capacidad y ubicación completos; activo es opcional.',
  })
  @ApiOkResponse({ type: EspacioResponseDto })
  @ApiErrors(400, 401, 403, 404, 409)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearEspacioDto,
  ) {
    return this.espacios.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiIdParam()
  @ApiOperation({
    summary: 'Eliminar o desactivar un espacio',
    description:
      'Solo ADMIN. Si tiene cualquier reserva, conserva el historial y establece activo=false. Sin reservas, elimina el espacio.',
  })
  @ApiOkResponse({ type: EliminarEspacioResponseDto })
  @ApiErrors(400, 401, 403, 404)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.espacios.eliminar(id);
  }
}
