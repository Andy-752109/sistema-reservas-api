import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { HealthResponseDto } from './health-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async check(): Promise<HealthResponseDto> {
    const version =
      this.config.get<string>('COMMIT_SHA', 'development').trim() ||
      'development';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', version, database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        version,
        database: 'down',
      });
    }
  }
}
