import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePayoutRequestDto,
  ProcessPayoutRequestDto,
  CreateBankAccountDto,
} from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------
  private async getOrCreateWallet(shopId: number) {
    const existing = await this.prisma.seller_wallets.findUnique({
      where: { shop_id: shopId },
    });
    if (existing) return existing;
    return this.prisma.seller_wallets.create({ data: { shop_id: shopId } });
  }

  private async requireShop(userId: number) {
    const shop = await this.prisma.shops.findUnique({
      where: { owner_id: userId },
    });
    if (!shop) throw new NotFoundException('Không tìm thấy shop của bạn');
    return shop;
  }

  // -------------------------------------------------------
  // Seller endpoints
  // -------------------------------------------------------
  async getWalletForSeller(userId: number) {
    const shop = await this.requireShop(userId);
    const wallet = await this.getOrCreateWallet(shop.id);
    return {
      balance: Number(wallet.balance),
      pending_balance: Number(wallet.pending_balance),
      total_earned: Number(wallet.total_earned),
      commission_rate: Number(shop.commission_rate),
      updated_at: wallet.updated_at,
    };
  }

  async getTransactions(userId: number, page = 1, limit = 20) {
    const shop = await this.requireShop(userId);
    const wallet = await this.getOrCreateWallet(shop.id);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.wallet_transactions.findMany({
        where: { wallet_id: wallet.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wallet_transactions.count({
        where: { wallet_id: wallet.id },
      }),
    ]);
    return { items, total, page, limit };
  }

  async requestPayout(userId: number, dto: CreatePayoutRequestDto) {
    const shop = await this.requireShop(userId);
    const wallet = await this.getOrCreateWallet(shop.id);

    if (dto.amount <= 0)
      throw new BadRequestException('Số tiền rút phải lớn hơn 0');
    if (Number(wallet.balance) < dto.amount)
      throw new BadRequestException('Số dư không đủ để rút');

    const pendingReq = await this.prisma.payout_requests.findFirst({
      where: { shop_id: shop.id, status: 'pending' },
    });
    if (pendingReq)
      throw new BadRequestException(
        'Bạn đã có yêu cầu rút tiền đang chờ xử lý',
      );

    // Resolve bank info from saved account or inline fields
    let bankName: string | undefined;
    let bankAccount: string | undefined;
    let accountName: string | undefined;
    let bankAccountId: number | undefined;

    if (dto.bank_account_id) {
      const saved = await this.prisma.shop_bank_accounts.findFirst({
        where: { id: dto.bank_account_id, shop_id: shop.id },
      });
      if (!saved)
        throw new BadRequestException('Không tìm thấy tài khoản ngân hàng');
      bankName = saved.bank_name;
      bankAccount = saved.bank_account;
      accountName = saved.account_name;
      bankAccountId = saved.id;
    } else {
      if (!dto.bank_name || !dto.bank_account || !dto.account_name)
        throw new BadRequestException(
          'Vui lòng cung cấp thông tin tài khoản ngân hàng',
        );
      bankName = dto.bank_name;
      bankAccount = dto.bank_account;
      accountName = dto.account_name;
    }

    await this.prisma.$transaction(async (tx) => {
      // Hold balance while request is pending
      await tx.seller_wallets.update({
        where: { id: wallet.id },
        data: { balance: { decrement: dto.amount } },
      });
      await tx.payout_requests.create({
        data: {
          shop_id: shop.id,
          wallet_id: wallet.id,
          amount: dto.amount,
          bank_name: bankName,
          bank_account: bankAccount,
          account_name: accountName,
          bank_account_id: bankAccountId,
          status: 'pending',
        },
      });
      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          type: 'debit_payout',
          amount: dto.amount,
          note: `Yêu cầu rút tiền - ${bankName} ${bankAccount} (${accountName})`,
        },
      });
    });
    return {
      success: true,
      message: 'Yêu cầu rút tiền đã được gửi thành công',
    };
  }

  async getMyPayoutRequests(userId: number, query: any) {
    const shop = await this.requireShop(userId);
    const { page = 1, limit = 20 } = query || {};
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      this.prisma.payout_requests.findMany({
        where: { shop_id: shop.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.payout_requests.count({ where: { shop_id: shop.id } }),
    ]);
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  // -------------------------------------------------------
  // Bank account management
  // -------------------------------------------------------

  // Known Vietnamese bank BINs for local validation
  private static readonly VALID_BINS = new Set([
    '970436',
    '970415',
    '970418',
    '970405',
    '970407',
    '970422',
    '970416',
    '970432',
    '970423',
    '970403',
    '970437',
    '970441',
    '970448',
    '970443',
    '970431',
    '970426',
    '970440',
    '970449',
    '970419',
    '970409',
    '970406',
    '970412',
    '970428',
    '546034',
    '963388',
  ]);

  async verifyBankAccount(bin: string, accountNumber: string) {
    if (!WalletService.VALID_BINS.has(bin)) {
      throw new BadRequestException(
        'Mã ngân hàng không hợp lệ. Vui lòng chọn ngân hàng từ danh sách.',
      );
    }

    if (!/^\d{6,20}$/.test(accountNumber)) {
      throw new BadRequestException(
        'Số tài khoản không hợp lệ. Chỉ nhập số, từ 6 đến 20 ký tự.',
      );
    }

    return {
      valid: true,
      accountNumber,
      message:
        'Định dạng số tài khoản hợp lệ. Vui lòng nhập chính xác tên chủ tài khoản.',
    };
  }

  async getBankAccounts(userId: number) {
    const shop = await this.requireShop(userId);
    return this.prisma.shop_bank_accounts.findMany({
      where: { shop_id: shop.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
    });
  }

  async addBankAccount(userId: number, dto: CreateBankAccountDto) {
    const shop = await this.requireShop(userId);
    const count = await this.prisma.shop_bank_accounts.count({
      where: { shop_id: shop.id },
    });
    if (count >= 5)
      throw new BadRequestException('Tối đa 5 tài khoản ngân hàng');

    const isDefault = dto.is_default || count === 0;

    if (isDefault) {
      // Unset existing default
      await this.prisma.shop_bank_accounts.updateMany({
        where: { shop_id: shop.id, is_default: true },
        data: { is_default: false },
      });
    }

    const account = await this.prisma.shop_bank_accounts.create({
      data: {
        shop_id: shop.id,
        bank_name: dto.bank_name,
        bank_account: dto.bank_account,
        account_name: dto.account_name,
        is_default: isDefault,
      },
    });
    return account;
  }

  async deleteBankAccount(userId: number, accountId: number) {
    const shop = await this.requireShop(userId);
    const account = await this.prisma.shop_bank_accounts.findFirst({
      where: { id: accountId, shop_id: shop.id },
    });
    if (!account)
      throw new NotFoundException('Không tìm thấy tài khoản ngân hàng');

    await this.prisma.shop_bank_accounts.delete({ where: { id: accountId } });

    // If deleted was default, set first remaining as default
    if (account.is_default) {
      const first = await this.prisma.shop_bank_accounts.findFirst({
        where: { shop_id: shop.id },
      });
      if (first)
        await this.prisma.shop_bank_accounts.update({
          where: { id: first.id },
          data: { is_default: true },
        });
    }
    return { success: true };
  }

  async setDefaultBankAccount(userId: number, accountId: number) {
    const shop = await this.requireShop(userId);
    const account = await this.prisma.shop_bank_accounts.findFirst({
      where: { id: accountId, shop_id: shop.id },
    });
    if (!account)
      throw new NotFoundException('Không tìm thấy tài khoản ngân hàng');

    await this.prisma.$transaction([
      this.prisma.shop_bank_accounts.updateMany({
        where: { shop_id: shop.id },
        data: { is_default: false },
      }),
      this.prisma.shop_bank_accounts.update({
        where: { id: accountId },
        data: { is_default: true },
      }),
    ]);
    return { success: true };
  }

  // -------------------------------------------------------
  // Called by OrderService when order is delivered
  // -------------------------------------------------------
  async settleOrder(orderId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });
    if (!order) return;

    // Idempotency guard
    const existing = await this.prisma.platform_revenue.findUnique({
      where: { order_id: orderId },
    });
    if (existing) return;

    const shop = order.shop;
    const commissionRate = Number(shop.commission_rate);
    const gross = Number(order.subtotal_amount);
    const commissionAmt = Math.round(gross * commissionRate);
    const sellerAmt = gross - commissionAmt;

    await this.prisma.$transaction(async (tx) => {
      await tx.platform_revenue.create({
        data: {
          order_id: orderId,
          shop_id: shop.id,
          gross_amount: gross,
          commission_rate: commissionRate,
          commission_amt: commissionAmt,
          seller_amt: sellerAmt,
        },
      });

      const wallet = await tx.seller_wallets.findUnique({
        where: { shop_id: shop.id },
      });
      const walletId = wallet
        ? wallet.id
        : (await tx.seller_wallets.create({ data: { shop_id: shop.id } })).id;

      await tx.seller_wallets.update({
        where: { id: walletId },
        data: {
          balance: { increment: sellerAmt },
          total_earned: { increment: sellerAmt },
        },
      });

      await tx.wallet_transactions.create({
        data: {
          wallet_id: walletId,
          order_id: orderId,
          type: 'credit_sale',
          amount: sellerAmt,
          note: `Đơn hàng #${orderId} giao thành công. Hoa hồng ${(commissionRate * 100).toFixed(1)}% (${commissionAmt.toLocaleString('vi')}đ)`,
        },
      });
    });
  }

  // Called by OrderService when order is refunded
  async debitForRefund(orderId: number) {
    const revenue = await this.prisma.platform_revenue.findUnique({
      where: { order_id: orderId },
    });
    if (!revenue) return; // order was never settled

    const wallet = await this.prisma.seller_wallets.findFirst({
      where: { shop_id: revenue.shop_id },
    });
    if (!wallet) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.seller_wallets.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: Number(revenue.seller_amt) },
          total_earned: { decrement: Number(revenue.seller_amt) },
        },
      });
      await tx.wallet_transactions.create({
        data: {
          wallet_id: wallet.id,
          order_id: orderId,
          type: 'debit_refund',
          amount: Number(revenue.seller_amt),
          note: `Hoàn tiền cho đơn hàng #${orderId}`,
        },
      });
    });
  }

  // -------------------------------------------------------
  // Admin endpoints
  // -------------------------------------------------------
  async adminListPayoutRequests(query: any) {
    const { page = 1, limit = 20, status } = query || {};
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.payout_requests.findMany({
        where,
        include: {
          wallet: {
            include: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  owner: { select: { email: true, full_name: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.payout_requests.count({ where }),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  }

  async adminProcessPayout(id: number, dto: ProcessPayoutRequestDto) {
    const req = await this.prisma.payout_requests.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    if (req.status !== 'pending')
      throw new BadRequestException('Yêu cầu này đã được xử lý rồi');

    if (dto.status === 'rejected') {
      // Refund balance back to wallet
      await this.prisma.$transaction(async (tx) => {
        await tx.payout_requests.update({
          where: { id },
          data: { status: 'rejected', admin_note: dto.admin_note },
        });
        await tx.seller_wallets.update({
          where: { id: req.wallet_id },
          data: { balance: { increment: Number(req.amount) } },
        });
        await tx.wallet_transactions.create({
          data: {
            wallet_id: req.wallet_id,
            type: 'credit_refund_payout',
            amount: Number(req.amount),
            note: `Hoàn lại tiền rút bị từ chối. ${dto.admin_note || ''}`,
          },
        });
      });
    } else {
      await this.prisma.payout_requests.update({
        where: { id },
        data: { status: dto.status, admin_note: dto.admin_note },
      });
    }

    return { success: true, message: 'Cập nhật yêu cầu rút tiền thành công' };
  }

  async adminGetPlatformRevenue(query: any) {
    const { page = 1, limit = 20 } = query || {};
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total, aggregate] = await Promise.all([
      this.prisma.platform_revenue.findMany({
        orderBy: { settled_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.platform_revenue.count(),
      this.prisma.platform_revenue.aggregate({
        _sum: { commission_amt: true, gross_amount: true },
      }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      total_commission: Number(aggregate._sum.commission_amt || 0),
      total_gmv: Number(aggregate._sum.gross_amount || 0),
    };
  }
}
