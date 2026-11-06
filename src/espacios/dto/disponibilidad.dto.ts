import { IsString, Matches } from 'class-validator';

export class DisponibilidadDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha!: string;
}
