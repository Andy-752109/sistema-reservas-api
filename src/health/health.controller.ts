import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './health-response.dto';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('sistema')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Consultar salud de la API y PostgreSQL',
    description:
      'Público, para smoke tests. Ejecuta SELECT 1 en PostgreSQL. Devuelve 503 si la consulta falla; no expone diagnósticos internos ni credenciales.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    type: HealthResponseDto,
    example: {
      status: 'error',
      version: '0123456789abcdef0123456789abcdef01234567',
      database: 'down',
    },
  })
  check() {
    return this.health.check();
  }
}
