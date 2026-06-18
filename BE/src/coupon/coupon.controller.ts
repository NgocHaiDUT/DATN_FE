import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ApplyCouponDto,
} from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/Permission.enum';

@ApiTags('coupons')
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // ===== Admin endpoints =====

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create coupon (Admin)' })
  async create(@Body() dto: CreateCouponDto) {
    const data = await this.couponService.create(dto);
    return { message: 'Coupon created successfully', data };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'List all coupons (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    const data = await this.couponService.findAll(
      page,
      limit,
      includeDeleted === true,
    );
    return { message: 'Coupons retrieved', data };
  }

  @Get('my')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List vouchers of authenticated customer' })
  async findMyVouchers(@Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    const data = await this.couponService.findMyVouchers(userId);
    return { message: 'User vouchers retrieved', data };
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get coupon by ID (Admin)' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.couponService.findById(id);
    return { message: 'Coupon retrieved', data };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update coupon (Admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    const data = await this.couponService.update(id, dto);
    return { message: 'Coupon updated', data };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Soft delete coupon (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.couponService.softDelete(id);
    return { message: 'Coupon deleted' };
  }

  // ===== Public endpoint: validate coupon =====

  @Post('validate')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate coupon and calculate discount' })
  async validate(@Body() dto: ApplyCouponDto, @Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    if (dto.user_voucher_id) {
      const result = await this.couponService.validateUserVoucher(
        userId,
        dto.user_voucher_id,
        dto.subtotal,
        dto.shipping_fee ?? 0,
      );
      return {
        message: 'Voucher is valid',
        data: {
          user_voucher_id: result.userVoucher.id,
          code: result.coupon.code,
          discount_type: result.coupon.discount_type,
          discount_value: Number(result.coupon.discount_value),
          voucher_type: result.coupon.voucher_type || 'order',
          discount_amount: result.discountAmount,
        },
      };
    }

    if (!dto.code) {
      throw new BadRequestException(
        'Coupon code or user voucher id is required',
      );
    }

    const result = await this.couponService.validateAndCalculate(
      dto.code,
      dto.subtotal,
      dto.shipping_fee ?? 0,
    );
    return {
      message: 'Coupon is valid',
      data: {
        code: result.coupon.code,
        discount_type: result.coupon.discount_type,
        discount_value: Number(result.coupon.discount_value),
        voucher_type: result.coupon.voucher_type || 'order',
        discount_amount: result.discountAmount,
      },
    };
  }
}
