import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../common/api-docs.decorators';
import { LoginResponseDto } from '../common/dto/api-responses.dto';

@Controller()
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Devuelve un JWT con sub y rol. Credenciales inválidas reciben 401.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiErrors(400, 401)
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
