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

@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espacios: EspaciosService) {}

  @Get()
  listar(@Query() query: ListarEspaciosDto) {
    return this.espacios.listar(query.tipo);
  }

  @Get(':id/disponibilidad')
  verDisponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: DisponibilidadDto,
  ) {
    return this.espacios.verDisponibilidad(id, query.fecha);
  }

  @Get(':id')
  consultar(@Param('id', ParseIntPipe) id: number) {
    return this.espacios.consultar(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  crear(@Body() dto: CrearEspacioDto) {
    return this.espacios.crear(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearEspacioDto,
  ) {
    return this.espacios.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.espacios.eliminar(id);
  }
}
