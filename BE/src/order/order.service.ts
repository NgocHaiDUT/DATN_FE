import { ResponseMessages } from '../common/constants/messages.constant';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderDto,
  GetServicesDto,
  CalculateFeeDto,
  GetLeadtimeDto,
} from '../delivery/dto/ghn-order.dto';
import { DeliveryService } from '../delivery/delivery.service';
import { CalculateCartShippingDto } from './dto/calculate-shipping.dto';

import { PaymentFactory } from '../payment/payment.factory';
import { CreatePaymentUrlDto } from '../payment/dto/payment.dto';
import { OrderEmailService } from './order-email.service';
import { CouponService } from '../coupon/coupon.service';
import { WalletService } from '../wallet/wallet.service';
import { UserWalletService } from '../user-wallet/user-wallet.service';

interface ProductVariant {
  id: number;
  name: string | null;
  product_id: number;
  sku: string;
  shade_hex: string | null;
  size_label: string | null;
  price: any;
  compare_at_price: any;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService,
    private paymentFactory: PaymentFactory,
    private orderEmailService: OrderEmailService,
    private couponService: CouponService,
    private walletService: WalletService,
    private userWalletService: UserWalletService,
  ) {}

  private normalizePaymentMethod(
    paymentMethod?: string,
  ): 'cod' | 'vnpay' | 'wallet' {
    const normalized = (paymentMethod || 'cod').toLowerCase();
    if (normalized === 'online') return 'vnpay';
    if (['cod', 'vnpay', 'wallet'].includes(normalized)) {
      return normalized as 'cod' | 'vnpay' | 'wallet';
    }
    throw new BadRequestException('Phuong thuc thanh toan khong hop le');
  }

  private getClientIp(req?: any): string {
    const forwarded = req?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return (
      req?.socket?.remoteAddress ||
      req?.connection?.remoteAddress ||
      '127.0.0.1'
    );
  }

  private async assertCanManageShop(
    userId: number,
    shopId: number,
    permissionName: string,
  ) {
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: { owner_id: true },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.owner_id === userId) return;

    const staff = await this.prisma.shop_staffs.findFirst({
      where: { shop_id: shopId, user_id: userId },
    });
    if (!staff) {
      throw new ForbiddenException('You do not have permission for this shop');
    }

    const userPermission = await this.prisma.userpermission.findFirst({
      where: {
        user_id: userId,
        permission: { name: permissionName },
      },
    });
    if (!userPermission) {
      throw new ForbiddenException('You do not have permission for this shop');
    }
  }

  private async assertCanManageOrder(userId: number, orderId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { shop_id: true },
    });
    if (!order) throw new NotFoundException(ResponseMessages.ORDER.NOT_FOUND);
    await this.assertCanManageShop(userId, order.shop_id, 'manage_order');
  }

  private isValidOrderTransition(current: string, next: string) {
    if (current === next) return true;
    const transitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };
    return transitions[current]?.includes(next) ?? false;
  }

  private async restoreStockForOrder(tx: any, orderId: number) {
    const items = await tx.order_items.findMany({
      where: { order_id: orderId },
      select: { variant_id: true, quantity: true },
    });

    for (const item of items) {
      if (!item.variant_id) continue;
      await tx.product_variants.update({
        where: { id: item.variant_id },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  async calculateShippingForItems(
    userId: number,
    dto: CalculateCartShippingDto,
  ) {
    const { items, shipping_address_id } = dto;

    // 1. Get User's Shipping Address
    let shippingAddress;
    if (shipping_address_id) {
      shippingAddress = await this.prisma.addresses.findFirst({
        where: { id: shipping_address_id, user_id: userId },
      });
      if (!shippingAddress) {
        throw new NotFoundException(
          'Shipping address not found or does not belong to user.',
        );
      }
    } else {
      shippingAddress = await this.prisma.addresses.findFirst({
        where: { user_id: userId, is_default: true },
      });
      if (!shippingAddress) {
        throw new NotFoundException('Default shipping address not found.');
      }
    }

    if (!shippingAddress.ghn_district_id || !shippingAddress.ghn_ward_code) {
      throw new BadRequestException(
        'Shipping address is missing GHN location details.',
      );
    }

    // 2. Fetch product details for all variants
    const variantIds = items.map((item) => item.variant_id);
    const variants = await this.prisma.product_variants.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            shop: {
              include: {
                addresses: {
                  where: { is_default: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 3. Group items by shop
    const itemsByShop = new Map<number, any[]>();
    for (const item of items) {
      const variant = variantMap.get(item.variant_id);
      if (!variant) {
        throw new NotFoundException(
          `Variant with ID ${item.variant_id} not found.`,
        );
      }
      const shopId = variant.product.shop_id;
      if (!itemsByShop.has(shopId)) {
        itemsByShop.set(shopId, []);
      }
      itemsByShop.get(shopId)!.push({ ...variant, quantity: item.quantity });
    }

    // 4. Calculate shipping for each shop
    let totalShippingFee = 0;
    const shippingDetails: {
      shop_id: number;
      shop_name: string;
      fee: number;
      service_id: number;
    }[] = [];

    for (const [shopId, shopItems] of itemsByShop.entries()) {
      const firstItem = shopItems[0];
      const shop = firstItem.product.shop;

      if (!shop || !shop.addresses[0] || !shop.ghn_shop_id) {
        throw new BadRequestException(
          `Shop ${shop?.name || shopId} is not configured for shipping.`,
        );
      }
      const pickupAddress = shop.addresses[0];

      const ghnItems: CreateOrderItemDto[] = shopItems.map((item) => ({
        name: item.product.name,
        code: item.sku,
        quantity: item.quantity,
        price: Math.round(Number(item.price)),
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
      }));

      // --- Re-using the fee calculation logic ---
      const availableServices = await this.deliveryService.getAvailableServices(
        {
          from_district: pickupAddress.ghn_district_id!,
          to_district: shippingAddress.ghn_district_id!,
          shop_id: shop.ghn_shop_id,
        },
      );

      if (!availableServices || availableServices.length === 0) {
        throw new Error(
          `No available shipping services for shop ${shop.name}.`,
        );
      }

      const allItemsHaveDimensions = ghnItems.every(
        (item) => item.length && item.width && item.height && item.weight,
      );

      const feePromises = availableServices.map(async (service) => {
        if (service.service_type_id === 5 && !allItemsHaveDimensions) {
          return null;
        }
        try {
          const feeDto: CalculateFeeDto = {
            shop_id: shop.ghn_shop_id ?? undefined,
            from_district_id: pickupAddress.ghn_district_id!,
            from_ward_code: pickupAddress.ghn_ward_code!,
            to_district_id: shippingAddress.ghn_district_id!,
            to_ward_code: shippingAddress.ghn_ward_code!,
            service_id: service.service_id,
            service_type_id: service.service_type_id,
            insurance_value: shopItems.reduce(
              (sum, item) => sum + Number(item.price) * item.quantity,
              0,
            ),
            cod_amount: 0, // Not relevant for fee calculation
            height: ghnItems.reduce(
              (sum, item) => sum + (item.height || 0) * item.quantity,
              0,
            ),
            length: Math.max(...ghnItems.map((item) => item.length || 0)),
            width: Math.max(...ghnItems.map((item) => item.width || 0)),
            weight: ghnItems.reduce(
              (sum, item) => sum + (item.weight || 0) * item.quantity,
              0,
            ),
            items: ghnItems,
          };
          const feeResponse =
            await this.deliveryService.calculateShippingFee(feeDto);
          return { service_id: service.service_id, fee: feeResponse.total };
        } catch (error) {
          return null;
        }
      });

      const feeResults = (await Promise.all(feePromises)).filter(
        (result): result is { service_id: number; fee: number } =>
          result !== null,
      );

      if (feeResults.length === 0) {
        throw new BadRequestException(
          `Could not calculate shipping fee for shop ${shop.name}. Products may be missing dimensions.`,
        );
      }

      const cheapestFee = feeResults.reduce((prev, curr) =>
        prev.fee < curr.fee ? prev : curr,
      );

      totalShippingFee += cheapestFee.fee;
      shippingDetails.push({
        shop_id: shopId,
        shop_name: shop.name,
        fee: cheapestFee.fee,
        service_id: cheapestFee.service_id,
      });
    }

    return {
      total_shipping_fee: totalShippingFee,
      details: shippingDetails,
    };
  }

  private async createOrdersFromItemsSafe(
    userId: number,
    shippingAddressId: number,
    items: { variant_id: number; quantity: number }[],
    note?: string,
    paymentMethod?: string,
    req?: any,
    couponCode?: string,
    userVoucherId?: number,
  ) {
    if (!items || items.length === 0) {
      return { success: false, message: ResponseMessages.ORDER_ERR.NO_ITEMS };
    }

    const normalizedPaymentMethod = this.normalizePaymentMethod(paymentMethod);
    const mergedItems = Array.from(
      items.reduce((map, item) => {
        if (!item.variant_id || item.quantity <= 0) {
          throw new BadRequestException('San pham hoac so luong khong hop le');
        }
        map.set(
          item.variant_id,
          (map.get(item.variant_id) || 0) + item.quantity,
        );
        return map;
      }, new Map<number, number>()),
    ).map(([variant_id, quantity]) => ({ variant_id, quantity }));

    const shippingAddress = await this.prisma.addresses.findFirst({
      where: { id: shippingAddressId, user_id: userId },
    });

    if (
      !shippingAddress ||
      !shippingAddress.ghn_province_id ||
      !shippingAddress.ghn_district_id ||
      !shippingAddress.ghn_ward_code
    ) {
      return {
        success: false,
        message: ResponseMessages.ORDER_ERR.INVALID_ADDRESS,
      };
    }

    const variantIds = mergedItems.map((item) => item.variant_id);
    const variants = await this.prisma.product_variants.findMany({
      where: { id: { in: variantIds }, is_active: true, is_deleted: false },
      include: {
        product: {
          include: {
            shop: {
              include: {
                addresses: {
                  where: { is_default: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const cartItems = mergedItems.map((item) => {
      const variant = variantMap.get(item.variant_id);
      if (!variant) {
        throw new NotFoundException(
          `Variant with ID ${item.variant_id} not found.`,
        );
      }
      if (
        variant.product.is_deleted ||
        !variant.product.is_published ||
        variant.product.moderation_status !== 'approved'
      ) {
        throw new BadRequestException(
          `San pham "${variant.product.name}" hien khong the dat hang.`,
        );
      }
      if (
        variant.product.shop.is_deleted ||
        !variant.product.shop.is_verified
      ) {
        throw new BadRequestException(
          `Shop cua san pham "${variant.product.name}" hien khong kha dung.`,
        );
      }
      return { ...item, product: variant.product, variant };
    });

    const itemsByShop = cartItems.reduce<Record<number, typeof cartItems>>(
      (acc, item) => {
        const shopId = item.product.shop_id;
        if (!acc[shopId]) acc[shopId] = [];
        acc[shopId].push(item);
        return acc;
      },
      {},
    );

    if (
      normalizedPaymentMethod === 'vnpay' &&
      Object.keys(itemsByShop).length > 1
    ) {
      throw new BadRequestException(
        'VNPAY checkout chi ho tro mot shop trong moi lan thanh toan.',
      );
    }

    const orderDrafts: any[] = [];
    let checkoutTotal = 0;
    const firstShopId = Object.keys(itemsByShop)[0];

    for (const [shopId, groupedItems] of Object.entries(itemsByShop)) {
      const shop = groupedItems[0].product.shop;
      const pickupAddress = shop.addresses[0];
      if (
        !pickupAddress ||
        !shop.ghn_shop_id ||
        !pickupAddress.ghn_district_id ||
        !pickupAddress.ghn_ward_code
      ) {
        throw new BadRequestException(
          `Shop ${shop.name || shopId} khong co dia chi lay hang mac dinh hoac chua dang ky GHN.`,
        );
      }

      let subtotal = 0;
      const orderItems: any[] = [];
      const stockItems: any[] = [];
      const ghnItems: CreateOrderItemDto[] = [];

      for (const cartItem of groupedItems) {
        const variant = cartItem.variant;
        const quantity = cartItem.quantity;
        if (variant.stock < quantity) {
          throw new BadRequestException(
            `San pham "${cartItem.product.name}" (${variant.name || 'N/A'}) chi con ${variant.stock} trong kho.`,
          );
        }

        const unitPrice = Number(variant.price || 0);
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        orderItems.push({
          product_id: cartItem.product.id,
          variant_id: variant.id,
          name_snapshot: cartItem.product.name,
          variant_snapshot: variant.name || '',
          unit_price: unitPrice,
          quantity,
          line_total: lineTotal,
        });
        stockItems.push({
          variantId: variant.id,
          quantity,
          productName: cartItem.product.name,
          variantName: variant.name || 'N/A',
        });
        ghnItems.push({
          name: cartItem.product.name,
          code: variant.sku || cartItem.product.id.toString(),
          quantity,
          price: Math.round(unitPrice),
          length: variant.length ?? undefined,
          width: variant.width ?? undefined,
          height: variant.height ?? undefined,
          weight: variant.weight ?? undefined,
        });
      }

      let shippingFee = 0;
      let expectedDeliveryTime: Date | undefined;
      const availableServices = await this.deliveryService.getAvailableServices(
        {
          from_district: pickupAddress.ghn_district_id,
          to_district: shippingAddress.ghn_district_id,
          shop_id: shop.ghn_shop_id,
        },
      );
      if (!availableServices || availableServices.length === 0) {
        throw new BadRequestException(
          'Khong co dich vu van chuyen nao tu GHN.',
        );
      }

      const allItemsHaveDimensions = ghnItems.every(
        (item) => item.length && item.width && item.height && item.weight,
      );
      const feeResults = (
        await Promise.all(
          availableServices.map(async (service) => {
            if (service.service_type_id === 5 && !allItemsHaveDimensions)
              return null;
            try {
              const feeResponse =
                await this.deliveryService.calculateShippingFee({
                  shop_id: shop.ghn_shop_id ?? undefined,
                  from_district_id: pickupAddress.ghn_district_id!,
                  from_ward_code: pickupAddress.ghn_ward_code!,
                  to_district_id: shippingAddress.ghn_district_id!,
                  to_ward_code: shippingAddress.ghn_ward_code!,
                  service_id: service.service_id,
                  service_type_id: service.service_type_id,
                  insurance_value: Math.round(subtotal),
                  cod_amount: 0,
                  height: ghnItems.reduce(
                    (sum, item) => sum + (item.height || 0) * item.quantity,
                    0,
                  ),
                  length: Math.max(...ghnItems.map((item) => item.length || 0)),
                  width: Math.max(...ghnItems.map((item) => item.width || 0)),
                  weight: ghnItems.reduce(
                    (sum, item) => sum + (item.weight || 0) * item.quantity,
                    0,
                  ),
                  items: ghnItems,
                });
              return {
                service_id: service.service_id,
                service_type_id: service.service_type_id,
                fee: feeResponse.total,
              };
            } catch {
              return null;
            }
          }),
        )
      ).filter(
        (
          result,
        ): result is {
          service_id: number;
          service_type_id: number;
          fee: number;
        } => result !== null,
      );

      if (feeResults.length === 0) {
        throw new BadRequestException(
          'Khong the tinh phi van chuyen cho dich vu nao.',
        );
      }

      const cheapestService = feeResults.reduce((prev, curr) =>
        prev.fee < curr.fee ? prev : curr,
      );
      shippingFee = cheapestService.fee;

      const leadtimeResponse = await this.deliveryService.getLeadtime(
        {
          from_district_id: pickupAddress.ghn_district_id,
          from_ward_code: pickupAddress.ghn_ward_code,
          to_district_id: shippingAddress.ghn_district_id,
          to_ward_code: shippingAddress.ghn_ward_code,
          service_id: cheapestService.service_id,
        },
        shop.ghn_shop_id,
      );
      if (leadtimeResponse.leadtime) {
        expectedDeliveryTime = new Date(leadtimeResponse.leadtime * 1000);
      }

      let discountAmount = 0;
      let appliedCouponId: number | null = null;
      let appliedUserVoucherId: number | null = null;
      if (userVoucherId && shopId === firstShopId) {
        const couponResult = await this.couponService.validateUserVoucher(
          userId,
          userVoucherId,
          subtotal,
          shippingFee,
        );
        discountAmount = couponResult.discountAmount;
        appliedCouponId = couponResult.coupon.id;
        appliedUserVoucherId = couponResult.userVoucher.id;
      } else if (couponCode && shopId === firstShopId) {
        const couponResult = await this.couponService.validateAndCalculate(
          couponCode,
          subtotal,
          shippingFee,
        );
        discountAmount = couponResult.discountAmount;
        appliedCouponId = couponResult.coupon.id;
      }

      const totalAmount = subtotal + shippingFee;
      const finalTotal = Math.max(totalAmount - discountAmount, 0);
      checkoutTotal += finalTotal;

      orderDrafts.push({
        shopId: Number(shopId),
        pickupAddressId: pickupAddress.id,
        subtotal,
        shippingFee,
        totalAmount,
        finalTotal,
        discountAmount,
        appliedCouponId,
        appliedUserVoucherId,
        expectedDeliveryTime,
        orderItems,
        stockItems,
      });
    }

    if (normalizedPaymentMethod === 'wallet') {
      const wallet = await this.userWalletService.getWallet(userId);
      if (wallet.balance < checkoutTotal) {
        throw new BadRequestException(
          `So du vi khong du. Hien co: ${wallet.balance.toLocaleString('vi')} VND`,
        );
      }
    }

    const orderIds = await this.prisma.$transaction(async (tx) => {
      let walletId: number | null = null;
      if (normalizedPaymentMethod === 'wallet') {
        const wallet = await tx.user_wallets.upsert({
          where: { user_id: userId },
          update: {},
          create: { user_id: userId },
        });
        const debit = await tx.user_wallets.updateMany({
          where: { id: wallet.id, balance: { gte: checkoutTotal } },
          data: { balance: { decrement: checkoutTotal } },
        });
        if (debit.count !== 1) {
          throw new BadRequestException('So du vi khong du');
        }
        walletId = wallet.id;
      }

      const ids: number[] = [];
      for (const draft of orderDrafts) {
        const order = await tx.orders.create({
          data: {
            user_id: userId,
            shop_id: draft.shopId,
            shipping_address_id: shippingAddressId,
            pickup_address_id: draft.pickupAddressId,
            status: 'pending',
            payment_status:
              normalizedPaymentMethod === 'wallet' ? 'paid' : 'unpaid',
            subtotal_amount: draft.subtotal,
            discount_amount: draft.discountAmount,
            shipping_fee: draft.shippingFee,
            total_amount: draft.finalTotal,
            note,
            ghn_expected_delivery_time: draft.expectedDeliveryTime,
            shipping_payer:
              normalizedPaymentMethod === 'cod' ? 'BUYER' : 'SELLER',
          },
        });
        ids.push(order.id);

        if (draft.appliedCouponId) {
          await tx.order_coupons.create({
            data: {
              order_id: order.id,
              coupon_id: draft.appliedCouponId,
              user_voucher_id: draft.appliedUserVoucherId,
              amount: draft.discountAmount,
            },
          });
          await tx.coupons.update({
            where: { id: draft.appliedCouponId },
            data: { used_count: { increment: 1 } },
          });
          if (draft.appliedUserVoucherId) {
            await this.couponService.markUserVoucherUsed(
              tx,
              userId,
              draft.appliedUserVoucherId,
              order.id,
            );
          }
        }

        for (const orderItem of draft.orderItems) {
          await tx.order_items.create({
            data: { order_id: order.id, ...orderItem },
          });
        }

        for (const stockItem of draft.stockItems) {
          const updated = await tx.product_variants.updateMany({
            where: {
              id: stockItem.variantId,
              is_active: true,
              is_deleted: false,
              stock: { gte: stockItem.quantity },
            },
            data: { stock: { decrement: stockItem.quantity } },
          });
          if (updated.count !== 1) {
            throw new BadRequestException(
              `San pham "${stockItem.productName}" (${stockItem.variantName}) khong du ton kho.`,
            );
          }
        }

        await tx.payments.create({
          data: {
            order_id: order.id,
            provider: normalizedPaymentMethod,
            amount: draft.finalTotal,
            status: normalizedPaymentMethod === 'wallet' ? 'paid' : 'unpaid',
          },
        });

        await tx.shipments.create({
          data: {
            order_id: order.id,
            status: 'pending',
            address_snapshot: `${shippingAddress.street}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.province}`,
          },
        });

        if (normalizedPaymentMethod === 'wallet' && walletId) {
          await tx.user_wallet_transactions.create({
            data: {
              wallet_id: walletId,
              order_id: order.id,
              type: 'payment',
              amount: draft.finalTotal,
              note: `Thanh toan don hang #${order.id}`,
            },
          });
        }
      }

      const cart = await tx.carts.findUnique({ where: { user_id: userId } });
      if (cart) {
        await tx.cart_items.deleteMany({
          where: { cart_id: cart.id, variant_id: { in: variantIds } },
        });
      }

      return ids;
    });

    const createdOrders = await this.prisma.orders.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        shop_id: true,
        total_amount: true,
        payment_status: true,
        ghn_order_code: true,
        order_items: {
          select: {
            quantity: true,
            variant: { select: { id: true, name: true } },
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    let paymentUrl: string | null = null;
    if (normalizedPaymentMethod === 'vnpay' && createdOrders.length === 1) {
      const order = createdOrders[0];
      const paymentService = this.paymentFactory.getService('vnpay');
      paymentUrl = await paymentService.createPaymentUrl({
        orderId: order.id,
        amount: Number(order.total_amount),
        orderInfo: `Thanh toan don hang ${order.id}`,
        ipAddr: this.getClientIp(req),
      });
    }

    this.sendOrderEmails(
      userId,
      createdOrders,
      shippingAddress,
      normalizedPaymentMethod,
      couponCode,
    );

    return {
      success: true,
      message: ResponseMessages.ORDER.PLACE_SUCCESS,
      orders: createdOrders,
      paymentUrl,
    };
  }

  async createOrdersFromItems(
    userId: number,
    shippingAddressId: number,
    items: { variant_id: number; quantity: number }[],
    note?: string,
    paymentMethod?: string,
    req?: any,
    couponCode?: string,
    userVoucherId?: number,
  ) {
    try {
      return await this.createOrdersFromItemsSafe(
        userId,
        shippingAddressId,
        items,
        note,
        paymentMethod,
        req,
        couponCode,
        userVoucherId,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      console.error('Error creating order:', error);
      return { success: false, message: ResponseMessages.ORDER.CREATE_FAILED };
    }
  }
  /**
   * Send order confirmation emails for created orders (fire-and-forget)
   */
  private async sendOrderEmails(
    userId: number,
    createdOrders: any[],
    shippingAddress: any,
    paymentMethod: string,
    couponCode?: string,
  ) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, full_name: true },
      });
      if (!user?.email) return;

      for (const order of createdOrders) {
        const fullOrder = await this.prisma.orders.findUnique({
          where: { id: order.id },
          include: {
            shop: { select: { name: true } },
            order_items: {
              select: {
                name_snapshot: true,
                variant_snapshot: true,
                quantity: true,
                line_total: true,
              },
            },
          },
        });
        if (!fullOrder) continue;

        this.orderEmailService.sendOrderConfirmation({
          id: fullOrder.id,
          customerEmail: user.email,
          customerName: user.full_name || 'Khách hàng',
          shopName: fullOrder.shop?.name || 'Shop',
          items: fullOrder.order_items.map((i) => ({
            name: i.name_snapshot || 'Sản phẩm',
            variant: i.variant_snapshot || undefined,
            quantity: i.quantity,
            lineTotal: Number(i.line_total),
          })),
          subtotal: Number(fullOrder.subtotal_amount),
          discount: Number(fullOrder.discount_amount),
          shippingFee: Number(fullOrder.shipping_fee),
          totalAmount: Number(fullOrder.total_amount),
          shippingAddress: `${shippingAddress.street}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.province}`,
          paymentMethod,
        });
      }
    } catch (err) {
      // Silent fail — email should not break order flow
    }
  }

  private async sendStatusUpdateEmail(orderId: number, status: string) {
    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { email: true, full_name: true } },
          shop: { select: { name: true } },
          shipments: { select: { tracking_number: true }, take: 1 },
        },
      });
      if (!order?.user?.email) return;

      this.orderEmailService.sendStatusUpdate({
        orderId: order.id,
        customerEmail: order.user.email,
        customerName: order.user.full_name || 'Khách hàng',
        shopName: order.shop?.name || 'Shop',
        status,
        trackingNumber: order.shipments?.[0]?.tracking_number || undefined,
      });
    } catch {
      // Silent fail
    }
  }

  async createOrderFromProduct(
    userId: number,
    productId: number,
    variantId: number | null,
    quantity: number,
    shippingAddressId: number,
    note?: string,
    paymentMethod?: string,
    couponCode?: string,
    userVoucherId?: number,
  ) {
    try {
      let resolvedVariantId = variantId;
      if (!resolvedVariantId) {
        const firstVariant = await this.prisma.product_variants.findFirst({
          where: {
            product_id: productId,
            is_active: true,
            is_deleted: false,
          },
          orderBy: { id: 'asc' },
        });
        if (!firstVariant) {
          return {
            success: false,
            message: ResponseMessages.ORDER.NO_VALID_VARIANT,
          };
        }
        resolvedVariantId = firstVariant.id;
      }

      return await this.createOrdersFromItemsSafe(
        userId,
        shippingAddressId,
        [{ variant_id: resolvedVariantId, quantity }],
        note,
        paymentMethod,
        undefined,
        couponCode,
        userVoucherId,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      console.error('Error creating order from product:', error);
      return { success: false, message: ResponseMessages.ORDER.CREATE_FAILED };
    }
  }
  async getMyOrders(userId: number, query?: any) {
    try {
      const { page = 1, limit = 10, status } = query || {};
      const skip = (page - 1) * limit;

      const where: any = { user_id: userId };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        this.prisma.orders.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            payment_status: true,
            subtotal_amount: true,
            discount_amount: true,
            shipping_fee: true,
            total_amount: true,
            note: true,
            created_at: true,
            updated_at: true,
            shop: {
              select: {
                id: true,
                name: true,
                logo_url: true,
              },
            },
            order_items: {
              select: {
                id: true,
                name_snapshot: true,
                variant_snapshot: true,
                unit_price: true,
                quantity: true,
                line_total: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    product_media: {
                      take: 1,
                      orderBy: { id: 'asc' },
                      select: {
                        url: true,
                        type: true,
                      },
                    },
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
            shipping_address: {
              select: {
                recipient: true,
                phone: true,
                province: true,
                district: true,
                ward: true,
                street: true,
              },
            },
            payments: {
              select: {
                id: true,
                provider: true,
                amount: true,
                status: true,
                created_at: true,
              },
            },
            shipments: {
              select: {
                id: true,
                status: true,
                carrier: true,
                tracking_number: true,
                shipped_at: true,
                delivered_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.orders.count({ where }),
      ]);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, message: ResponseMessages.ORDER.LOAD_FAILED };
    }
  }

  async getOrderById(orderId: number, userId?: number) {
    try {
      const where: any = { id: orderId };
      if (userId) {
        where.user_id = userId;
      }

      const order = await this.prisma.orders.findFirst({
        where,
        select: {
          id: true,
          status: true,
          payment_status: true,
          subtotal_amount: true,
          discount_amount: true,
          shipping_fee: true,
          total_amount: true,
          note: true,
          created_at: true,
          updated_at: true,
          ghn_order_code: true,
          ghn_expected_delivery_time: true,
          shipping_payer: true,
          shop: {
            select: {
              id: true,
              name: true,
              logo_url: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
            },
          },
          order_items: {
            select: {
              id: true,
              name_snapshot: true,
              variant_snapshot: true,
              unit_price: true,
              quantity: true,
              line_total: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  product_media: {
                    take: 1,
                    orderBy: { id: 'asc' },
                    select: {
                      url: true,
                      type: true,
                    },
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true,
                },
              },
            },
          },
          shipping_address: {
            select: {
              recipient: true,
              phone: true,
              province: true,
              district: true,
              ward: true,
              street: true,
            },
          },
          payments: {
            select: {
              id: true,
              provider: true,
              amount: true,
              status: true,
              transaction_id: true,
              created_at: true,
            },
          },
          shipments: {
            select: {
              id: true,
              status: true,
              carrier: true,
              tracking_number: true,
              shipped_at: true,
              delivered_at: true,
              address_snapshot: true,
            },
          },
        },
      });

      if (!order) {
        return { success: false, message: ResponseMessages.ORDER.NOT_FOUND };
      }

      return { success: true, order };
    } catch (error) {
      console.error('Error fetching order:', error);
      return { success: false, message: ResponseMessages.ORDER.LOAD_FAILED };
    }
  }

  async cancelOrder(orderId: number, userId: number) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: {
          id: orderId,
          user_id: userId,
        },
        include: { payments: true },
      });

      if (!order) {
        return { success: false, message: ResponseMessages.ORDER.NOT_FOUND };
      }

      if (
        ['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)
      ) {
        return {
          success: false,
          message: ResponseMessages.ORDER.CANNOT_CANCEL_DELIVERED,
        };
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: 'cancelled',
            ...(order.payment_status === 'paid'
              ? { payment_status: 'refunded' }
              : {}),
            updated_at: new Date(),
          },
        });
        await this.restoreStockForOrder(tx, orderId);

        if (order.payment_status === 'paid') {
          await tx.payments.updateMany({
            where: { order_id: orderId },
            data: { status: 'refunded' },
          });
        }
      });

      if (order.payment_status === 'paid') {
        const payment = order.payments.find((item) =>
          ['vnpay', 'wallet'].includes(item.provider || ''),
        );
        if (payment) {
          await this.userWalletService.creditRefund(
            order.user_id,
            orderId,
            Number(order.total_amount),
          );
        }
      }

      return { success: true, message: ResponseMessages.ORDER.CANCELLED };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, message: ResponseMessages.ORDER.CANCEL_FAILED };
    }
  }

  // Seller/Staff
  async getOrdersByShop(shopId: number, userId: number, query?: any) {
    try {
      await this.assertCanManageShop(userId, shopId, 'manage_order');

      const { page = 1, limit = 10, status } = query || {};
      const skip = (page - 1) * limit;

      const where: any = { shop_id: shopId };
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        this.prisma.orders.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            payment_status: true,
            subtotal_amount: true,
            discount_amount: true,
            shipping_fee: true,
            total_amount: true,
            note: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                full_name: true,
                phone: true,
                avatar_url: true,
              },
            },
            order_items: {
              select: {
                id: true,
                product_id: true,
                variant_id: true,
                name_snapshot: true,
                variant_snapshot: true,
                unit_price: true,
                quantity: true,
                line_total: true,
                variant: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    product: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        product_media: {
                          take: 1,
                          orderBy: { id: 'asc' },
                          select: {
                            url: true,
                            type: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                provider: true,
                amount: true,
                status: true,
                transaction_id: true,
                created_at: true,
              },
            },
            shipments: {
              select: {
                id: true,
                status: true,
                carrier: true,
                tracking_number: true,
                shipped_at: true,
                delivered_at: true,
              },
            },
            shipping_address: {
              select: {
                recipient: true,
                phone: true,
                province: true,
                district: true,
                ward: true,
                street: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.orders.count({ where }),
      ]);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching shop orders:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.LOAD_SHOP_ORDER_FAILED,
      };
    }
  }

  async getSellerOrderById(orderId: number, userId: number) {
    await this.assertCanManageOrder(userId, orderId);
    return this.getOrderById(orderId);
  }

  async updateOrderStatus(orderId: number, status: string, userId?: number) {
    try {
      if (userId) {
        await this.assertCanManageOrder(userId, orderId);
        if (status === 'delivered') {
          return {
            success: false,
            message: 'Buyer must confirm receipt before an order is delivered',
          };
        }
      }

      const allowed = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ];
      if (!allowed.includes(status)) {
        return {
          success: false,
          message: ResponseMessages.ORDER.INVALID_STATUS,
        };
      }

      const currentOrder = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: { payments: true, order_items: true },
      });
      if (!currentOrder) {
        return { success: false, message: ResponseMessages.ORDER.NOT_FOUND };
      }
      if (!this.isValidOrderTransition(currentOrder.status, status)) {
        return { success: false, message: 'Invalid order status transition' };
      }

      const isCodOrder = currentOrder.payments.some(
        (payment) => payment.provider?.toLowerCase() === 'cod',
      );

      if (status === 'confirmed' && currentOrder.payment_status !== 'paid') {
        if (!isCodOrder) {
          throw new BadRequestException(
            'Order must be paid before confirmation',
          );
        }
      }

      if (
        userId &&
        status === 'cancelled' &&
        currentOrder.status === 'pending' &&
        currentOrder.payment_status !== 'paid' &&
        !isCodOrder
      ) {
        throw new BadRequestException(
          'Seller cannot cancel an unpaid online order',
        );
      }

      if (status === 'confirmed') {
        await this.createGhnOrderForExistingOrder(orderId);
      }

      // When delivered: mark COD payment as paid + settle commission
      if (status === 'delivered') {
        if (currentOrder.payment_status === 'unpaid') {
          // COD: cash was collected on delivery
          await this.prisma.payments.updateMany({
            where: { order_id: orderId, status: { in: ['unpaid', 'pending'] } },
            data: { status: 'paid' },
          });
        }
        this.walletService.settleOrder(orderId).catch(() => {});
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: status as any,
            ...(status === 'delivered' ? { payment_status: 'paid' } : {}),
            ...(status === 'refunded' ? { payment_status: 'refunded' } : {}),
            updated_at: new Date(),
          },
        });

        if (status === 'cancelled' || status === 'refunded') {
          await this.restoreStockForOrder(tx, orderId);
        }
        if (status === 'refunded') {
          await tx.payments.updateMany({
            where: { order_id: orderId },
            data: { status: 'refunded' },
          });
        }
      });

      if (status === 'refunded') {
        await this.walletService.debitForRefund(orderId);
        if (currentOrder.payment_status === 'paid') {
          const payment = currentOrder.payments.find((item) =>
            ['vnpay', 'wallet'].includes(item.provider || ''),
          );
          if (payment) {
            await this.userWalletService.creditRefund(
              currentOrder.user_id,
              orderId,
              Number(currentOrder.total_amount),
            );
          }
        }
      }

      // Send status update email (fire-and-forget)
      this.sendStatusUpdateEmail(orderId, status);

      return {
        success: true,
        message: ResponseMessages.ORDER.STATUS_UPDATE_SUCCESS,
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      return {
        success: false,
        message:
          (error instanceof Error ? error.message : null) ||
          'Lỗi khi cập nhật trạng thái đơn hàng',
      };
    }
  }

  async confirmOrderReceived(orderId: number, userId: number) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: { id: orderId, user_id: userId },
        include: { payments: true },
      });

      if (!order) {
        throw new NotFoundException(ResponseMessages.ORDER.NOT_FOUND);
      }

      if (order.status !== 'shipped') {
        throw new BadRequestException(
          'Only shipped orders can be confirmed as received',
        );
      }

      await this.prisma.$transaction(async (tx) => {
        if (order.payment_status === 'unpaid') {
          await tx.payments.updateMany({
            where: { order_id: orderId, status: { in: ['unpaid', 'pending'] } },
            data: { status: 'paid' },
          });
        }

        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: 'delivered',
            payment_status: 'paid',
            updated_at: new Date(),
          },
        });

        await tx.shipments.updateMany({
          where: { order_id: orderId },
          data: {
            status: 'delivered',
            delivered_at: new Date(),
          },
        });
      });

      this.walletService.settleOrder(orderId).catch(() => {});
      this.sendStatusUpdateEmail(orderId, 'delivered');

      return {
        success: true,
        message: 'Order receipt confirmed successfully',
      };
    } catch (error) {
      console.error('Error confirming order received:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      return {
        success: false,
        message:
          (error instanceof Error ? error.message : null) ||
          'Loi khi xac nhan da nhan hang',
      };
    }
  }

  // Admin
  async adminListOrders(query?: any) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        shopId,
        userId,
        search,
      } = query || {};
      const skip = (page - 1) * limit;
      const where: any = {};
      if (status) where.status = status;
      if (shopId) where.shop_id = Number(shopId);
      if (userId) where.user_id = Number(userId);

      // Add search functionality
      if (search) {
        const searchTerm = search.trim();
        const searchConditions: any[] = [];

        // Search by order ID if search term is a number
        const orderId = parseInt(searchTerm);
        if (!isNaN(orderId)) {
          searchConditions.push({ id: orderId });
        }

        // Search by customer name or email
        searchConditions.push({
          user: {
            OR: [
              { full_name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        });

        where.OR = searchConditions;
      }

      const [orders, total] = await Promise.all([
        this.prisma.orders.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            payment_status: true,
            subtotal_amount: true,
            discount_amount: true,
            shipping_fee: true,
            total_amount: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
              },
            },
            shop: {
              select: {
                id: true,
                name: true,
                logo_url: true,
              },
            },
            order_items: {
              select: {
                id: true,
                name_snapshot: true,
                variant_snapshot: true,
                unit_price: true,
                quantity: true,
                line_total: true,
              },
            },
            payments: {
              select: {
                id: true,
                provider: true,
                amount: true,
                status: true,
                created_at: true,
              },
            },
            shipments: {
              select: {
                id: true,
                status: true,
                tracking_number: true,
                delivered_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.orders.count({ where }),
      ]);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.LOAD_ADMIN_ORDER_FAILED,
      };
    }
  }

  async adminRefundOrder(orderId: number) {
    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });
      if (!order)
        return { success: false, message: ResponseMessages.ORDER.NOT_FOUND };
      if (['cancelled', 'refunded'].includes(order.status)) {
        return {
          success: false,
          message: ResponseMessages.ORDER.INVALID_STATUS,
        };
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: orderId },
          data: {
            status: 'refunded',
            payment_status: 'refunded',
            updated_at: new Date(),
          },
        });
        await tx.payments.updateMany({
          where: { order_id: orderId },
          data: { status: 'refunded' },
        });
        await this.restoreStockForOrder(tx, orderId);
      });

      // Debit seller wallet for refund
      await this.walletService.debitForRefund(orderId);
      if (order.payment_status === 'paid') {
        const payment = order.payments.find((item) =>
          ['vnpay', 'wallet'].includes(item.provider || ''),
        );
        if (payment) {
          await this.userWalletService.creditRefund(
            order.user_id,
            orderId,
            Number(order.total_amount),
          );
        }
      }

      return { success: true, message: ResponseMessages.ORDER.REFUND_SUCCESS };
    } catch (error) {
      console.error('Error refunding order:', error);
      return { success: false, message: ResponseMessages.ORDER.REFUND_FAILED };
    }
  }

  private async createGhnOrderForExistingOrder(orderId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shipping_address: true,
        pickup_address: true,
        shop: true,
        shipments: { take: 1 },
        payments: { take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException(ResponseMessages.ORDER.NOT_FOUND);
    }

    if (order.ghn_order_code) {
      return order.ghn_order_code;
    }

    const pickupAddress = order.pickup_address;
    const shippingAddress = order.shipping_address;
    const shop = order.shop;

    if (
      !pickupAddress ||
      !shippingAddress ||
      !shop ||
      !shop.ghn_shop_id ||
      !pickupAddress.ghn_district_id ||
      !pickupAddress.ghn_ward_code ||
      !shippingAddress.ghn_district_id ||
      !shippingAddress.ghn_ward_code
    ) {
      throw new BadRequestException(
        'Thiếu thông tin vận chuyển hoặc GHN của shop/người mua',
      );
    }

    const ghnItems: CreateOrderItemDto[] = order.order_items.map((item) => ({
      name: item.product.name,
      code: item.variant?.sku || item.product.id.toString(),
      quantity: item.quantity,
      price: Math.round(Number(item.unit_price)),
      length: item.variant?.length ?? undefined,
      width: item.variant?.width ?? undefined,
      height: item.variant?.height ?? undefined,
      weight: item.variant?.weight ?? undefined,
    }));

    const productNames = order.order_items.map(
      (item) =>
        `${item.product.name} (${item.variant?.name || 'N/A'}) x${item.quantity}`,
    );

    // Calculate shipping fee (re-calculate to get service_id)
    const availableServices = await this.deliveryService.getAvailableServices({
      from_district: pickupAddress.ghn_district_id,
      to_district: shippingAddress.ghn_district_id,
      shop_id: shop.ghn_shop_id,
    });

    if (!availableServices || availableServices.length === 0) {
      throw new BadRequestException('Không có dịch vụ vận chuyển nào từ GHN.');
    }

    const allItemsHaveDimensions = ghnItems.every(
      (item) => item.length && item.width && item.height && item.weight,
    );

    const feePromises = availableServices.map(async (service) => {
      if (service.service_type_id === 5 && !allItemsHaveDimensions) {
        return null;
      }
      try {
        const feeDto: CalculateFeeDto = {
          from_district_id: pickupAddress.ghn_district_id!,
          from_ward_code: pickupAddress.ghn_ward_code!,
          to_district_id: shippingAddress.ghn_district_id!,
          to_ward_code: shippingAddress.ghn_ward_code!,
          service_id: service.service_id,
          service_type_id: service.service_type_id,
          insurance_value: Math.round(Number(order.subtotal_amount)),
          cod_amount:
            order.payments[0]?.provider === 'cod'
              ? Math.round(Number(order.total_amount))
              : 0,
          height: ghnItems.reduce(
            (sum, item) => sum + (item.height || 0) * item.quantity,
            0,
          ),
          length: Math.max(...ghnItems.map((item) => item.length || 0)),
          width: Math.max(...ghnItems.map((item) => item.width || 0)),
          weight: ghnItems.reduce(
            (sum, item) => sum + (item.weight || 0) * item.quantity,
            0,
          ),
          items: ghnItems,
        };
        const feeResponse =
          await this.deliveryService.calculateShippingFee(feeDto);
        return {
          service_id: service.service_id,
          service_type_id: service.service_type_id,
          fee: feeResponse.total,
        };
      } catch {
        return null;
      }
    });

    const feeResults = (await Promise.all(feePromises)).filter(
      (r): r is any => r !== null,
    );
    if (feeResults.length === 0) {
      throw new BadRequestException('Không thể tính phí vận chuyển từ GHN.');
    }

    const cheapestService = feeResults.reduce((p, c) =>
      p.fee < c.fee ? p : c,
    );

    // Create GHN Order
    const provinces = await this.deliveryService.getProvinces();
    const toProvince = provinces.find(
      (p) => p.ProvinceID === shippingAddress.ghn_province_id,
    );
    const districts = await this.deliveryService.getDistricts(
      shippingAddress.ghn_province_id!,
    );
    const toDistrict = districts.find(
      (d) => d.DistrictID === shippingAddress.ghn_district_id,
    );
    const wards = await this.deliveryService.getWards(
      shippingAddress.ghn_district_id,
    );
    const toWard = wards.find(
      (w) => w.WardCode === shippingAddress.ghn_ward_code,
    );

    const ghnCreateOrderData: CreateOrderDto = {
      from_district_id: pickupAddress.ghn_district_id,
      to_district_id: shippingAddress.ghn_district_id,
      payment_type_id: order.payments[0]?.provider === 'cod' ? 2 : 1,
      note: order.note || '',
      required_note: 'KHONGCHOXEMHANG',
      from_name: shop.name,
      from_phone: shop.phone || pickupAddress.phone,
      from_address: pickupAddress.street,
      from_ward_name: pickupAddress.ward,
      from_district_name: pickupAddress.district,
      from_province_name: pickupAddress.province,
      to_name: shippingAddress.recipient,
      to_phone: shippingAddress.phone,
      to_address: shippingAddress.street,
      to_ward_name: toWard?.WardName || shippingAddress.ward,
      to_district_name: toDistrict?.DistrictName || shippingAddress.district,
      to_province_name: toProvince?.ProvinceName || shippingAddress.province,
      cod_amount:
        order.payments[0]?.provider === 'cod'
          ? Math.round(Number(order.total_amount))
          : 0,
      content: productNames.join(', ').substring(0, 2000),
      insurance_value: Math.round(Number(order.subtotal_amount)),
      items: ghnItems,
      service_id: cheapestService.service_id,
      service_type_id: cheapestService.service_type_id,
      weight: ghnItems.reduce(
        (sum, item) => sum + (item.weight || 0) * item.quantity,
        0,
      ),
      length: Math.max(...ghnItems.map((i) => i.length || 0)),
      width: Math.max(...ghnItems.map((i) => i.width || 0)),
      height: ghnItems.reduce(
        (sum, item) => sum + (item.height || 0) * item.quantity,
        0,
      ),
    };

    const ghnOrderResponse = await this.deliveryService.createShippingOrder(
      ghnCreateOrderData,
      shop.ghn_shop_id,
    );

    const ghnOrderCode = ghnOrderResponse.order_code;
    const expectedDelivery = ghnOrderResponse.expected_delivery_time;

    await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        ghn_order_code: ghnOrderCode,
        ghn_expected_delivery_time: expectedDelivery
          ? new Date(expectedDelivery)
          : null,
      },
    });

    if (order.shipments[0]) {
      await this.prisma.shipments.update({
        where: { id: order.shipments[0].id },
        data: { tracking_number: ghnOrderCode, carrier: 'GHN' },
      });

      await this.prisma.shipment_logs.create({
        data: {
          shipment_id: order.shipments[0].id,
          status: 'GHN_CREATED',
          location_description: 'Đơn hàng GHN đã được tạo khi shop xác nhận',
        },
      });
    }

    return ghnOrderCode;
  }

  // Helper function to map GHN statuses to internal shipment_status enum
  private mapGhnStatusToShipmentStatus(ghnStatus: string): string {
    switch (ghnStatus.toLowerCase()) {
      case 'ready_to_pick':
      case 'picking':
      case 'storing':
        return 'packing';
      case 'transporting':
      case 'shipping':
        return 'in_transit';
      case 'delivered':
        return 'delivered';
      case 'cancel':
        return 'failed';
      case 'returned':
        return 'returned';
      default:
        return 'pending';
    }
  }

  async trackGhnOrder(orderId: number, userId?: number) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: { id: orderId, ...(userId && { user_id: userId }) },
        include: { shipments: true },
      });

      if (!order || !order.ghn_order_code) {
        return {
          success: false,
          message: ResponseMessages.ORDER.GHN_ORDER_NOT_FOUND,
        };
      }

      const ghnDetail = await this.deliveryService.getShippingOrderDetail(
        order.ghn_order_code,
      );

      if (ghnDetail && order.shipments.length > 0) {
        const shipmentId = order.shipments[0].id;
        // Save new logs if they exist
        if (ghnDetail.log && Array.isArray(ghnDetail.log)) {
          for (const log of ghnDetail.log) {
            await this.prisma.shipment_logs.upsert({
              where: {
                shipment_id_status_updated_at: {
                  shipment_id: shipmentId,
                  status: log.status,
                  updated_at: new Date(log.updated_date),
                },
              },
              update: {}, // No update needed if it exists
              create: {
                shipment_id: shipmentId,
                status: log.status,
                location_description: log.reason || log.description || '',
                updated_at: new Date(log.updated_date),
              },
            });
          }
        }
        // Update overall shipment status
        const mappedStatus = this.mapGhnStatusToShipmentStatus(
          ghnDetail.status,
        );
        await this.prisma.shipments.update({
          where: { id: shipmentId },
          data: { status: mappedStatus as any },
        });
      }

      return { success: true, data: ghnDetail };
    } catch (error) {
      console.error('Error tracking GHN order:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_TRACKING_FAILED,
      };
    }
  }
  async cancelGhnOrder(orderId: number, userId: number) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: { id: orderId, user_id: userId },
        include: { shop: true },
      });

      if (!order || !order.ghn_order_code || !order.shop?.ghn_shop_id) {
        return {
          success: false,
          message: ResponseMessages.ORDER.GHN_ORDER_SHOP_NOT_FOUND,
        };
      }

      const result = await this.deliveryService.cancelShippingOrder(
        [order.ghn_order_code],
        order.shop.ghn_shop_id,
      );

      if (result && result[0]?.result) {
        await this.prisma.$transaction(async (tx) => {
          await tx.orders.update({
            where: { id: orderId },
            data: { status: 'cancelled', updated_at: new Date() },
          });
          await this.restoreStockForOrder(tx, orderId);
        });
        return {
          success: true,
          message: ResponseMessages.ORDER.GHN_CANCEL_SUCCESS,
        };
      }
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_CANCEL_FAILED_RES,
      };
    } catch (error) {
      console.error('Error cancelling GHN order:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_CANCEL_FAILED,
      };
    }
  }

  async updateGhnOrder(
    orderId: number,
    userId: number,
    updateData: Partial<UpdateOrderDto>,
  ) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: { id: orderId, user_id: userId },
        include: { shop: true },
      });

      if (!order || !order.ghn_order_code || !order.shop?.ghn_shop_id) {
        return {
          success: false,
          message: ResponseMessages.ORDER.GHN_ORDER_SHOP_NOT_FOUND,
        };
      }

      // GHN API expects specific fields for update, map updateData to GHN format
      const ghnUpdatePayload: Partial<UpdateOrderDto> = {
        note: updateData.note,
        required_note: updateData.required_note,
        to_name: updateData.to_name,
        to_phone: updateData.to_phone,
        to_address: updateData.to_address,
        to_ward_name: updateData.to_ward_name,
        to_district_name: updateData.to_district_name,
        cod_amount: updateData.cod_amount,
        content: updateData.content,
        length: updateData.length,
        width: updateData.width,
        height: updateData.height,
        weight: updateData.weight,
        insurance_value: updateData.insurance_value,
        items: updateData.items,
      };

      const result = await this.deliveryService.updateShippingOrder(
        order.ghn_order_code,
        ghnUpdatePayload,
        order.shop.ghn_shop_id,
      );

      if (result) {
        return {
          success: true,
          message: ResponseMessages.ORDER.GHN_UPDATE_SUCCESS,
        };
      }
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_UPDATE_FAILED_RES,
      };
    } catch (error) {
      console.error('Error updating GHN order:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_UPDATE_FAILED,
      };
    }
  }

  async returnGhnOrder(orderId: number, userId: number) {
    try {
      const order = await this.prisma.orders.findFirst({
        where: { id: orderId, user_id: userId },
        include: { shop: true },
      });

      if (!order || !order.ghn_order_code || !order.shop?.ghn_shop_id) {
        return {
          success: false,
          message: ResponseMessages.ORDER.GHN_ORDER_SHOP_NOT_FOUND,
        };
      }

      const result = await this.deliveryService.returnShippingOrder(
        [order.ghn_order_code],
        order.shop.ghn_shop_id,
      );

      if (result && result[0]?.result) {
        await this.prisma.$transaction(async (tx) => {
          await tx.orders.update({
            where: { id: orderId },
            data: {
              status: 'refunded',
              payment_status: 'refunded',
              updated_at: new Date(),
            },
          });
          await tx.payments.updateMany({
            where: { order_id: orderId },
            data: { status: 'refunded' },
          });
          await this.restoreStockForOrder(tx, orderId);
        });
        return {
          success: true,
          message: ResponseMessages.ORDER.GHN_RETURN_SUCCESS,
        };
      }
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_RETURN_FAILED_RES,
      };
    } catch (error) {
      console.error('Error returning GHN order:', error);
      return {
        success: false,
        message: ResponseMessages.ORDER.GHN_RETURN_FAILED,
      };
    }
  }

  // GHN Shipping Calculation Proxies
  async getAvailableServices(data: GetServicesDto) {
    return this.deliveryService.getAvailableServices(data);
  }

  async previewShippingOrder(data: CreateOrderDto) {
    return this.deliveryService.previewShippingOrder(data);
  }

  async getLeadtime(data: GetLeadtimeDto, shopId: number) {
    return this.deliveryService.getLeadtime(data, shopId);
  }

  // ===== Return/Refund Requests =====

  async createReturnRequest(userId: number, orderId: number, reason: string) {
    const order = await this.prisma.orders.findFirst({
      where: { id: orderId, user_id: userId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'delivered') {
      throw new BadRequestException(
        'Chỉ có thể yêu cầu trả hàng với đơn đã giao',
      );
    }

    const existing = await this.prisma.return_requests.findFirst({
      where: { order_id: orderId, status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
      throw new BadRequestException(
        'Đơn hàng đã có yêu cầu trả hàng đang xử lý',
      );
    }

    return this.prisma.return_requests.create({
      data: {
        order_id: orderId,
        user_id: userId,
        reason,
        refund_amount: order.total_amount,
      },
    });
  }

  async getMyReturnRequests(userId: number) {
    return this.prisma.return_requests.findMany({
      where: { user_id: userId },
      include: {
        order: {
          select: {
            id: true,
            total_amount: true,
            status: true,
            shop: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async adminGetReturnRequests(query?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = query || {};
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.return_requests.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              total_amount: true,
              status: true,
              shop: { select: { name: true } },
            },
          },
          user: { select: { id: true, email: true, full_name: true } },
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      this.prisma.return_requests.count({ where }),
    ]);

    return {
      items: data,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async adminUpdateReturnRequest(
    requestId: number,
    status: string,
    adminNote?: string,
    refundAmount?: number,
  ) {
    const request = await this.prisma.return_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Return request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Yêu cầu đã được xử lý');
    }

    const updated = await this.prisma.return_requests.update({
      where: { id: requestId },
      data: {
        status: status as any,
        admin_note: adminNote,
        refund_amount: refundAmount ?? request.refund_amount,
      },
    });

    if (status === 'approved') {
      const order = await this.prisma.orders.findUnique({
        where: { id: request.order_id },
        include: { payments: true },
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: request.order_id },
          data: {
            status: 'refunded',
            payment_status: 'refunded',
            updated_at: new Date(),
          },
        });
        await tx.payments.updateMany({
          where: { order_id: request.order_id },
          data: { status: 'refunded' },
        });
        await this.restoreStockForOrder(tx, request.order_id);
      });
      await this.walletService.debitForRefund(request.order_id);
      if (order?.payment_status === 'paid') {
        const payment = order.payments.find((item) =>
          ['vnpay', 'wallet'].includes(item.provider || ''),
        );
        if (payment) {
          await this.userWalletService.creditRefund(
            order.user_id,
            request.order_id,
            Number(refundAmount ?? request.refund_amount ?? order.total_amount),
          );
        }
      }
      this.sendStatusUpdateEmail(request.order_id, 'refunded');
    }

    return updated;
  }
}
