import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsInt,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER20', description: 'Coupon code (unique)' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ example: 'Giam 20% cho don hang mua he' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'percentage', enum: ['percentage', 'fixed'] })
  @IsString()
  @IsIn(['percentage', 'fixed'])
  discount_type!: string;

  @ApiPropertyOptional({ example: 'order', enum: ['order', 'shipping'] })
  @IsOptional()
  @IsString()
  @IsIn(['order', 'shipping'])
  voucher_type?: string;

  @ApiProperty({ example: 20, description: 'Discount value (% or VND)' })
  @Type(() => Number)
  @IsNumber()
  discount_value!: number;

  @ApiPropertyOptional({ example: 100000, description: 'Minimum subtotal' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_subtotal?: number;

  @ApiPropertyOptional({ example: 100, description: 'Usage limit' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usage_limit?: number;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  ends_at?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 'Giam 20% cho don hang mua he' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'percentage', enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsString()
  @IsIn(['percentage', 'fixed'])
  discount_type?: string;

  @ApiPropertyOptional({ example: 'order', enum: ['order', 'shipping'] })
  @IsOptional()
  @IsString()
  @IsIn(['order', 'shipping'])
  voucher_type?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount_value?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_subtotal?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usage_limit?: number;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  ends_at?: string;
}

export class ApplyCouponDto {
  @ApiPropertyOptional({ example: 'SUMMER20', description: 'Coupon code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 12, description: 'Customer voucher id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_voucher_id?: number;

  @ApiProperty({ example: 250000, description: 'Order subtotal' })
  @Type(() => Number)
  @IsNumber()
  subtotal!: number;

  @ApiPropertyOptional({ example: 30000, description: 'Shipping fee' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shipping_fee?: number;
}
