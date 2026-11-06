import { IsInt, IsISO8601, IsString, Matches, Max, Min } from 'class-validator';

export class GuardarReservaDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  espacioId!: number;

  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  inicio!: string;

  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  fin!: string;
}
