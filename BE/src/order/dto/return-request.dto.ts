import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReturnRequestDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  @Type(() => Number)
  @IsNumber()
  order_id!: number;

  @ApiProperty({ example: 'Sản phẩm bị lỗi', description: 'Lý do trả hàng' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class UpdateReturnRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'], example: 'approved' })
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: string;

  @ApiPropertyOptional({ example: 'Chấp nhận đổi trả' })
  @IsOptional()
  @IsString()
  admin_note?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Số tiền hoàn' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  refund_amount?: number;
}
