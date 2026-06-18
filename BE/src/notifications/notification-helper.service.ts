import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationHelperService {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  // Order notification
  async handleOrderStatusChange(
    orderId: number,
    userId: number,
    status: string,
  ): Promise<void> {
    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, full_name: true } },
        },
      });

      if (!order || !order.user) return;

      await this.notificationsService.createForUser(order.user.id, {
        type: 'order_status',
        title: 'Cập nhật đơn hàng',
        body: `Đơn hàng #${orderId} đã chuyển sang trạng thái: ${status}`,
        meta_json: {
          order_id: orderId,
          status,
        },
      });
    } catch (error) {
      console.error(
        '❌ [NotificationHelper] Error creating order notification:',
        error,
      );
    }
  }

  // Review notification for shop owner
  async handleNewReview(
    reviewId: number,
    productId: number,
    reviewerId: number,
  ): Promise<void> {
    try {
      const product = await this.prisma.products.findUnique({
        where: { id: productId },
        include: {
          shop: {
            include: {
              owner: { select: { id: true, full_name: true } },
            },
          },
        },
      });

      if (!product || !product.shop || product.shop.owner.id === reviewerId)
        return;

      const reviewer = await this.prisma.users.findUnique({
        where: { id: reviewerId },
        select: { id: true, full_name: true, avatar_url: true },
      });

      if (!reviewer) return;

      await this.notificationsService.createForUser(product.shop.owner.id, {
        type: 'new_review',
        title: 'Đánh giá mới cho sản phẩm',
        body: `${reviewer.full_name || 'Khách hàng'} đã đánh giá sản phẩm "${product.name}"`,
        meta_json: {
          actor_id: reviewerId,
          actor_name: reviewer.full_name || 'Khách hàng',
          actor_avatar: reviewer.avatar_url,
          product_id: productId,
          product_name: product.name,
          review_id: reviewId,
        },
      });
    } catch (error) {
      console.error(
        '❌ [NotificationHelper] Error creating review notification:',
        error,
      );
    }
  }
}
