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

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Get()
  listar(@Req() req: AuthRequest) {
    return this.reservas.listar(req.user);
  }

  @Post()
  crear(@Body() dto: GuardarReservaDto, @Req() req: AuthRequest) {
    return this.reservas.crear(dto, req.user);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarReservaDto,
    @Req() req: AuthRequest,
  ) {
    return this.reservas.actualizar(id, dto, req.user);
  }

  @Delete(':id')
  cancelar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.reservas.cancelar(id, req.user);
  }
}
