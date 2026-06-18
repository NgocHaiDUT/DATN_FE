import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VnpayService as ThirdPartyVnpayService } from 'nestjs-vnpay';
import { ConfigService } from '@nestjs/config';
import { ProductCode } from 'vnpay';

@Injectable()
export class UserWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: ThirdPartyVnpayService,
    private readonly configService: ConfigService,
  ) {}

  private async getOrCreateWallet(userId: number) {
    const existing = await this.prisma.user_wallets.findUnique({
      where: { user_id: userId },
    });
    if (existing) return existing;
    return this.prisma.user_wallets.create({ data: { user_id: userId } });
  }

  async getWallet(userId: number) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: Number(wallet.balance),
      updated_at: wallet.updated_at,
    };
  }

  async getTransactions(userId: number, page = 1, limit = 20) {
    const wallet = await this.getOrCreateWallet(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user_wallet_transactions.findMany({
        where: { wallet_id: wallet.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user_wallet_transactions.count({
        where: { wallet_id: wallet.id },
      }),
    ]);
    return { items, total, page, limit };
  }

  /**
   * Initiate a VNPay top-up for the user wallet. Returns a VNPay payment URL.
   */
  async initiateTopup(
    userId: number,
    amount: number,
    ipAddr: string,
  ): Promise<string> {
    if (amount < 10000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 10,000₫');
    }

    const wallet = await this.getOrCreateWallet(userId);

    // Unique txn ref: "W" + walletId + timestamp
    const vnpTxnRef = `W${wallet.id}_${Date.now()}`;

    await this.prisma.wallet_topup_requests.create({
      data: {
        wallet_id: wallet.id,
        amount,
        vnp_txn_ref: vnpTxnRef,
        status: 'pending',
      },
    });

    const returnUrl =
      this.configService.get<string>('VNPAY_TOPUP_RETURN_URL') ||
      `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000'}/user-wallet/topup-return`;

    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: `Nap tien vi - ${vnpTxnRef}`,
      vnp_OrderType: ProductCode.Health_Beauty,
      vnp_ReturnUrl: returnUrl,
    });

    return paymentUrl;
  }

  /**
   * Handle VNPay return/IPN for wallet top-up.
   */
  async confirmTopup(
    query: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    const vnpTxnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];
    const transactionStatus = query['vnp_TransactionStatus'];
    const transactionNo = query['vnp_TransactionNo'];

    const topup = await this.prisma.wallet_topup_requests.findUnique({
      where: { vnp_txn_ref: vnpTxnRef },
    });

    if (!topup) {
      return { success: false, message: 'Không tìm thấy yêu cầu nạp tiền' };
    }

    if (topup.status !== 'pending') {
      return { success: true, message: 'Giao dịch đã được xử lý trước đó' };
    }

    const isSuccess = responseCode === '00' && transactionStatus === '00';

    await this.prisma.wallet_topup_requests.update({
      where: { id: topup.id },
      data: {
        status: isSuccess ? 'paid' : 'failed',
        transaction_id: transactionNo,
      },
    });

    if (isSuccess) {
      const amount = Number(topup.amount);
      await this.prisma.$transaction(async (tx) => {
        await tx.user_wallets.update({
          where: { id: topup.wallet_id },
          data: { balance: { increment: amount } },
        });
        await tx.user_wallet_transactions.create({
          data: {
            wallet_id: topup.wallet_id,
            type: 'topup',
            amount,
            note: `Nạp tiền qua VNPay - ${vnpTxnRef}`,
          },
        });
      });
    }

    return {
      success: isSuccess,
      message: isSuccess ? 'Nạp tiền thành công' : 'Giao dịch thất bại',
    };
  }

  /**
   * Deduct wallet balance to pay for an order. Throws if insufficient balance.
   */
  async deductForOrder(
    userId: number,
    orderId: number,
    amount: number,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Số dư ví không đủ. Hiện có: ${Number(wallet.balance).toLocaleString('vi')}₫`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user_wallets.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.user_wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          order_id: orderId,
          type: 'payment',
          amount,
          note: `Thanh toán đơn hàng #${orderId}`,
        },
      });
    });
  }

  /**
   * Credit refund amount to user wallet when a paid order is cancelled.
   */
  async creditRefund(userId: number, orderId: number, amount: number) {
    const wallet = await this.getOrCreateWallet(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.user_wallets.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.user_wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          order_id: orderId,
          type: 'refund',
          amount,
          note: `Hoàn tiền đơn hàng #${orderId} (đã hủy)`,
        },
      });
    });
  }
}
