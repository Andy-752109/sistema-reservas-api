import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EspaciosController } from './espacios.controller';
import { EspaciosService } from './espacios.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EspaciosController],
  providers: [EspaciosService],
})
export class EspaciosModule {}
