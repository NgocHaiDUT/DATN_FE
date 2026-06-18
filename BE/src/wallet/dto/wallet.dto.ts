import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  Min,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutRequestDto {
  @ApiProperty({
    example: 500000,
    description: 'Số tiền muốn rút (VND, tối thiểu 10,000đ)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  amount!: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID tài khoản ngân hàng đã lưu',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bank_account_id?: number;

  @ApiPropertyOptional({
    example: 'Vietcombank',
    description: 'Tên ngân hàng (nếu không dùng tài khoản đã lưu)',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Số tài khoản (nếu không dùng tài khoản đã lưu)',
  })
  @IsOptional()
  @IsString()
  bank_account?: string;

  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Tên chủ tài khoản',
  })
  @IsOptional()
  @IsString()
  account_name?: string;
}

export class ProcessPayoutRequestDto {
  @ApiProperty({
    enum: ['approved', 'rejected', 'paid'],
    example: 'paid',
    description:
      'Trạng thái xử lý: approved (đã duyệt), rejected (từ chối), paid (đã chuyển khoản)',
  })
  @IsString()
  @IsIn(['approved', 'rejected', 'paid'])
  status!: string;

  @ApiPropertyOptional({
    example: 'Đã chuyển khoản lúc 10:00',
    description: 'Ghi chú admin',
  })
  @IsOptional()
  @IsString()
  admin_note?: string;
}

export class VerifyBankAccountDto {
  @ApiProperty({ example: '970436', description: 'Mã BIN ngân hàng' })
  @IsString()
  @IsNotEmpty()
  bin!: string;

  @ApiProperty({ example: '1234567890', description: 'Số tài khoản ngân hàng' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;
}

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Vietcombank' })
  @IsString()
  @IsNotEmpty()
  bank_name!: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  bank_account!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  account_name!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Đặt làm tài khoản mặc định',
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
