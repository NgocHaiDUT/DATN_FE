import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService as ThirdPartyVnpayService } from 'nestjs-vnpay';
import {
  PaymentStrategy,
  HandleIpnResponse,
  VerifyReturnResponse,
} from './payment.strategy';
import { CreatePaymentUrlDto, VnpayReturnDto } from '../dto/payment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductCode } from 'vnpay';

@Injectable()
export class VnpayService implements PaymentStrategy {
  constructor(
    private readonly thirdPartyVnpayService: ThirdPartyVnpayService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createPaymentUrl(
    createPaymentUrlDto: CreatePaymentUrlDto,
  ): Promise<string> {
    let { amount, orderInfo, orderId, ipAddr } = createPaymentUrlDto;

    // If amount is 0, fetch from order
    if (amount === 0) {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException(`Order #${orderId} not found`);
      }
      if (
        createPaymentUrlDto.userId &&
        order.user_id !== createPaymentUrlDto.userId
      ) {
        throw new BadRequestException('Order does not belong to current user');
      }
      if (order.payment_status !== 'unpaid') {
        throw new BadRequestException('Order is not payable');
      }
      if (order.status !== 'pending') {
        throw new BadRequestException('Order is not pending payment');
      }

      amount = order.total_amount.toNumber();
    }

    const returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/payment/vnpay-return';

    // Corrected method name
    const paymentUrl = this.thirdPartyVnpayService.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Health_Beauty, // Mã loại hàng hóa 'Sức khỏe - Làm đẹp' theo VNPAY
      vnp_ReturnUrl: returnUrl,
    });

    return paymentUrl;
  }

  async verifyReturn(data: VnpayReturnDto): Promise<VerifyReturnResponse> {
    // Corrected with await and extracting isSuccess from the returned object
    const verificationResult =
      await this.thirdPartyVnpayService.verifyReturnUrl(data);
    const isValid = verificationResult.isSuccess;

    return {
      isValid,
      orderId: data.vnp_TxnRef,
      amount: Number(data.vnp_Amount) / 100,
      isSuccess:
        isValid &&
        data.vnp_ResponseCode === '00' &&
        data.vnp_TransactionStatus === '00',
      message:
        isValid && data.vnp_ResponseCode === '00'
          ? 'Giao dịch thành công'
          : 'Giao dịch thất bại hoặc chữ ký không hợp lệ',
    };
  }

  async handleIpn(data: VnpayReturnDto): Promise<HandleIpnResponse> {
    // Corrected with await
    const isValid = await this.thirdPartyVnpayService.verifyIpnCall(data);

    if (!isValid) {
      return {
        RspCode: '97',
        Message: 'Invalid Checksum',
      };
    }

    const orderId = Number(data.vnp_TxnRef);
    const amount = Number(data.vnp_Amount) / 100;

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return {
        RspCode: '01',
        Message: 'Order not found',
      };
    }

    // Corrected decimal comparison
    if (order.total_amount.toNumber() !== amount) {
      return {
        RspCode: '04',
        Message: 'Invalid amount',
      };
    }

    if (order.payment_status === 'paid') {
      return {
        RspCode: '02',
        Message: 'Order already confirmed',
      };
    }
    if (order.payment_status === 'failed') {
      return {
        RspCode: '02',
        Message: 'Order already failed',
      };
    }
    if (order.status !== 'pending') {
      return {
        RspCode: '02',
        Message: 'Order is not payable',
      };
    }

    // Handle successful payment
    const isSuccess = this.isSuccessResponse(data);
    await this.persistPaymentStatus(order, data, isSuccess);

    return isSuccess
      ? {
          RspCode: '00',
          Message: 'Success',
        }
      : {
          RspCode: '99',
          Message: 'Payment failed',
        };
  }

  async confirmReturnPayment(data: VnpayReturnDto): Promise<void> {
    const orderId = Number(data.vnp_TxnRef);
    const amount = Number(data.vnp_Amount) / 100;

    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.total_amount.toNumber() !== amount) {
      throw new BadRequestException('Invalid amount');
    }

    if (order.payment_status === 'paid') {
      return;
    }
    if (order.payment_status === 'failed') {
      return;
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not payable');
    }

    await this.persistPaymentStatus(order, data, this.isSuccessResponse(data));
  }

  private isSuccessResponse(data: VnpayReturnDto): boolean {
    return (
      data.vnp_ResponseCode === '00' && data.vnp_TransactionStatus === '00'
    );
  }

  private async persistPaymentStatus(
    order: {
      id: number;
      status?: string;
      payment_status?: string;
      payments: { id: number; status: string | null }[];
    },
    data: VnpayReturnDto,
    isSuccess: boolean,
  ): Promise<void> {
    const nextStatus = isSuccess ? 'paid' : 'failed';

    await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: order.id },
        data: {
          payment_status: nextStatus,
          ...(!isSuccess ? { status: 'cancelled' as any } : {}),
          updated_at: new Date(),
        },
      });

      const payment = order.payments.find((p) =>
        ['pending', 'unpaid'].includes(p.status || ''),
      );

      if (payment) {
        await tx.payments.update({
          where: { id: payment.id },
          data: {
            status: nextStatus,
            transaction_id: data.vnp_TransactionNo,
            payload_raw: JSON.stringify(data),
          },
        });
      }

      if (!isSuccess && order.status !== 'cancelled') {
        const items = await tx.order_items.findMany({
          where: { order_id: order.id },
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
    });
  }
}
