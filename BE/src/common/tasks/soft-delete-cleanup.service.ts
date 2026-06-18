import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SoftDeleteCleanupService {
  private readonly logger = new Logger(SoftDeleteCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleSoftDeleteCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.logger.log(
      'Starting soft-delete cleanup (items deleted > 30 days ago)...',
    );

    const results = await Promise.allSettled([
      this.prisma.users.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.shops.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.products.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.product_variants.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.orders.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.reviews.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.prisma.coupons.deleteMany({
        where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      }),
      this.cleanupMessages(thirtyDaysAgo),
    ]);

    const tables = [
      'users',
      'shops',
      'products',
      'product_variants',
      'orders',
      'reviews',
      'coupons',
      'messages',
    ];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.count > 0) {
          this.logger.log(
            `Hard-deleted ${result.value.count} ${tables[index]}`,
          );
        }
      } else {
        this.logger.error(
          `Failed to cleanup ${tables[index]}: ${result.reason}`,
        );
      }
    });

    this.logger.log('Soft-delete cleanup completed');
  }

  private async cleanupMessages(thirtyDaysAgo: Date) {
    const messages = await this.prisma.messages.findMany({
      where: { is_deleted: true, deleted_at: { lte: thirtyDaysAgo } },
      select: { id: true },
    });
    const ids = messages.map((message) => message.id);
    if (ids.length === 0) return { count: 0 };

    await this.prisma.messages.updateMany({
      where: { reply_to_id: { in: ids } },
      data: { reply_to_id: null },
    });
    await this.prisma.message_reads.deleteMany({
      where: { message_id: { in: ids } },
    });

    return this.prisma.messages.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
