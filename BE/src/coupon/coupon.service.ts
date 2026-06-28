import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly vrReviewRewardCode = 'VR_REVIEW_SHIP_30K';

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupons.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    return this.prisma.coupons.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discount_type: dto.discount_type,
        voucher_type: dto.voucher_type ?? 'order',
        discount_value: dto.discount_value,
        min_subtotal: dto.min_subtotal ?? 0,
        usage_limit: dto.usage_limit,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
      },
    });
  }

  async findAll(page = 1, limit = 20, includeDeleted = false) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = includeDeleted ? {} : { is_deleted: false };

    const [data, total] = await Promise.all([
      this.prisma.coupons.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      this.prisma.coupons.count({ where }),
    ]);

    return {
      items: data,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: number) {
    const coupon = await this.prisma.coupons.findUnique({ where: { id } });
    if (!coupon || coupon.is_deleted) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: number, dto: UpdateCouponDto) {
    await this.findById(id);
    return this.prisma.coupons.update({
      where: { id },
      data: {
        ...dto,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
      },
    });
  }

  async softDelete(id: number) {
    await this.findById(id);
    return this.prisma.coupons.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date() },
    });
  }

  /**
   * Validate and calculate coupon discount for checkout
   */
  async validateAndCalculate(code: string, subtotal: number, shippingFee = 0) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    this.assertCouponUsable(coupon, subtotal);
    const discountAmount = this.calculateDiscount(
      coupon,
      subtotal,
      shippingFee,
    );

    return { coupon, discountAmount };
  }

  private assertCouponUsable(coupon: any, subtotal: number) {
    if (!coupon || coupon.is_deleted) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();
    if (coupon.starts_at && now < coupon.starts_at) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.ends_at && now > coupon.ends_at) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.usage_limit && (coupon.used_count ?? 0) >= coupon.usage_limit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.min_subtotal && subtotal < Number(coupon.min_subtotal)) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.min_subtotal}`,
      );
    }
  }

  private calculateDiscount(coupon: any, subtotal: number, shippingFee = 0) {
    const voucherType = coupon.voucher_type || 'order';
    const baseAmount = voucherType === 'shipping' ? shippingFee : subtotal;
    if (baseAmount <= 0) return 0;

    if (coupon.discount_type === 'percentage') {
      return Math.min(
        Math.round(baseAmount * (Number(coupon.discount_value) / 100)),
        baseAmount,
      );
    }

    return Math.min(Number(coupon.discount_value), baseAmount);
  }

  async findMyVouchers(userId: number) {
    const now = new Date();
    const vouchers = await this.prisma.user_vouchers.findMany({
      where: { user_id: userId },
      include: { coupon: true },
      orderBy: [
        { status: 'asc' },
        { expires_at: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return vouchers.map((voucher) => {
      const isExpired =
        voucher.status === 'available' &&
        ((voucher.expires_at && voucher.expires_at < now) ||
          (voucher.coupon.ends_at && voucher.coupon.ends_at < now));

      return {
        id: voucher.id,
        status: isExpired ? 'expired' : voucher.status,
        source: voucher.source,
        starts_at: voucher.starts_at,
        expires_at: voucher.expires_at || voucher.coupon.ends_at,
        used_at: voucher.used_at,
        coupon: {
          id: voucher.coupon.id,
          code: voucher.coupon.code,
          description: voucher.coupon.description,
          discount_type: voucher.coupon.discount_type,
          discount_value: Number(voucher.coupon.discount_value),
          voucher_type: voucher.coupon.voucher_type || 'order',
          min_subtotal: Number(voucher.coupon.min_subtotal || 0),
        },
      };
    });
  }

  async grantVrReviewShippingVoucher(userId: number) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const coupon = await this.prisma.coupons.upsert({
      where: { code: this.vrReviewRewardCode },
      create: {
        code: this.vrReviewRewardCode,
        description: 'Voucher giảm 30k phí ship sau khi đánh giá VR Makeup',
        discount_type: 'fixed',
        discount_value: 30000,
        voucher_type: 'shipping',
        min_subtotal: 0,
        starts_at: now,
      },
      update: {
        description: 'Voucher giảm 30k phí ship sau khi đánh giá VR Makeup',
        discount_type: 'fixed',
        discount_value: 30000,
        voucher_type: 'shipping',
        is_deleted: false,
        deleted_at: null,
      },
    });

    return this.prisma.user_vouchers.create({
      data: {
        user_id: userId,
        coupon_id: coupon.id,
        source: 'vr_review',
        status: 'available',
        starts_at: now,
        expires_at: expiresAt,
      },
      include: { coupon: true },
    });
  }

  async validateUserVoucher(
    userId: number,
    userVoucherId: number,
    subtotal: number,
    shippingFee = 0,
  ) {
    const userVoucher = await this.prisma.user_vouchers.findFirst({
      where: { id: userVoucherId, user_id: userId },
      include: { coupon: true },
    });
    if (!userVoucher) {
      throw new NotFoundException('Voucher not found');
    }
    if (userVoucher.status !== 'available' || userVoucher.used_at) {
      throw new BadRequestException('Voucher has already been used');
    }

    const now = new Date();
    if (userVoucher.starts_at && now < userVoucher.starts_at) {
      throw new BadRequestException('Voucher is not active yet');
    }
    if (userVoucher.expires_at && now > userVoucher.expires_at) {
      throw new BadRequestException('Voucher has expired');
    }

    this.assertCouponUsable(userVoucher.coupon, subtotal);
    const discountAmount = this.calculateDiscount(
      userVoucher.coupon,
      subtotal,
      shippingFee,
    );
    if (discountAmount <= 0) {
      throw new BadRequestException('Voucher cannot be applied to this order');
    }

    return { userVoucher, coupon: userVoucher.coupon, discountAmount };
  }

  async markUserVoucherUsed(
    tx: Prisma.TransactionClient,
    userId: number,
    userVoucherId: number,
    orderId: number,
  ) {
    const updated = await tx.user_vouchers.updateMany({
      where: {
        id: userVoucherId,
        user_id: userId,
        status: 'available',
        used_at: null,
      },
      data: { status: 'used', used_at: new Date(), order_id: orderId },
    });
    if (updated.count !== 1) {
      throw new BadRequestException('Voucher is no longer available');
    }
  }

  /**
   * Increment used_count after successful order
   */
  async incrementUsage(couponId: number) {
    await this.prisma.coupons.update({
      where: { id: couponId },
      data: { used_count: { increment: 1 } },
    });
  }
}
