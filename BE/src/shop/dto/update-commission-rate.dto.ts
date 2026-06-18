import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionRateDto {
  @ApiProperty({
    description: 'Platform commission rate as a decimal. Example: 0.03 = 3%',
    example: 0.03,
    minimum: 0,
    maximum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  commission_rate: number;
}
