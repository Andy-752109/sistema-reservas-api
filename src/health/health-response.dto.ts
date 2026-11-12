import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({
    description:
      'SHA del commit suministrado en COMMIT_SHA; development si no está configurado.',
    example: '0123456789abcdef0123456789abcdef01234567',
  })
  version!: string;

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database!: 'up' | 'down';
}
