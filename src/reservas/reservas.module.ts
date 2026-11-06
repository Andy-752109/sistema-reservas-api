import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
