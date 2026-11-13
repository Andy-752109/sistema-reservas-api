import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GuardarReservaDto } from './dto/guardar-reserva.dto';
import { ReservasService } from './reservas.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors, ApiIdParam } from '../common/api-docs.decorators';
import { ReservaResponseDto } from '../common/dto/api-responses.dto';

@Controller('reservas')
@ApiTags('reservas')
@ApiBearerAuth()
@ApiErrors(401)
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar reservas',
    description:
      'El usuario ve las propias, de cualquier estado. ADMIN ve todas.',
  })
  @ApiOkResponse({ type: [ReservaResponseDto] })
  listar(@Req() req: AuthRequest) {
    return this.reservas.listar(req.user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una reserva',
    description:
      'El propietario se toma del JWT. Valida inicio < fin, espacio activo y traslape con reservas ACTIVAS. Los conflictos reciben 409; se permiten reservas contiguas.',
  })
  @ApiCreatedResponse({ type: ReservaResponseDto })
  @ApiErrors(400, 404, 409)
  crear(@Body() dto: GuardarReservaDto, @Req() req: AuthRequest) {
    return this.reservas.crear(dto, req.user);
  }

  @Put(':id')
  @ApiIdParam()
  @ApiOperation({
    summary: 'Modificar una reserva ACTIVA',
    description:
      'Solo propietario o ADMIN. Requiere el cuerpo completo; revalida traslape excluyendo la propia reserva y permite cambiar de espacio. Conserva propietario y estado.',
  })
  @ApiOkResponse({ type: ReservaResponseDto })
  @ApiErrors(400, 403, 404, 409)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarReservaDto,
    @Req() req: AuthRequest,
  ) {
    return this.reservas.actualizar(id, dto, req.user);
  }

  @Delete(':id')
  @ApiIdParam()
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description:
      'Solo propietario o ADMIN. Cambia el estado a CANCELADA sin borrar el registro; repetir la cancelación conserva ese estado.',
  })
  @ApiOkResponse({
    type: ReservaResponseDto,
    description: 'Reserva conservada con estado CANCELADA.',
    example: {
      id: 1,
      usuarioId: 1,
      espacioId: 1,
      inicio: '2026-11-10T15:00:00.000Z',
      fin: '2026-11-10T16:00:00.000Z',
      estado: 'CANCELADA',
      creadoEn: '2026-11-09T15:00:00.000Z',
      actualizadoEn: '2026-11-09T16:00:00.000Z',
    },
  })
  @ApiErrors(400, 403, 404)
  cancelar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.reservas.cancelar(id, req.user);
  }
}
