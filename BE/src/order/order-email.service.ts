import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

@Injectable()
export class OrderEmailService {
  private readonly logger = new Logger(OrderEmailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendOrderConfirmation(order: {
    id: number;
    customerEmail: string;
    customerName: string;
    shopName: string;
    items: {
      name: string;
      variant?: string;
      quantity: number;
      lineTotal: number;
    }[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    totalAmount: number;
    shippingAddress: string;
    paymentMethod: string;
  }) {
    try {
      await this.mailer.sendMail({
        to: order.customerEmail,
        subject: `[Beauty Shop] Xác nhận đơn hàng #${order.id}`,
        template: 'order-confirmation',
        context: {
          orderId: order.id,
          customerName: order.customerName,
          shopName: order.shopName,
          items: order.items.map((i) => ({
            ...i,
            lineTotal: i.lineTotal.toLocaleString('vi-VN'),
          })),
          subtotal: order.subtotal.toLocaleString('vi-VN'),
          discount:
            order.discount > 0 ? order.discount.toLocaleString('vi-VN') : null,
          shippingFee: order.shippingFee.toLocaleString('vi-VN'),
          totalAmount: order.totalAmount.toLocaleString('vi-VN'),
          shippingAddress: order.shippingAddress,
          paymentMethod:
            order.paymentMethod === 'cod'
              ? 'Thanh toán khi nhận hàng (COD)'
              : 'VNPay',
        },
      });
      this.logger.log(`Order confirmation email sent for order #${order.id}`);
    } catch (err) {
      this.logger.error(
        `Failed to send order confirmation email: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async sendStatusUpdate(data: {
    orderId: number;
    customerEmail: string;
    customerName: string;
    shopName: string;
    status: string;
    trackingNumber?: string;
  }) {
    try {
      await this.mailer.sendMail({
        to: data.customerEmail,
        subject: `[Beauty Shop] Cập nhật đơn hàng #${data.orderId} - ${STATUS_LABELS[data.status] || data.status}`,
        template: 'order-status-update',
        context: {
          orderId: data.orderId,
          customerName: data.customerName,
          shopName: data.shopName,
          status: STATUS_LABELS[data.status] || data.status,
          trackingNumber: data.trackingNumber,
        },
      });
      this.logger.log(`Status update email sent for order #${data.orderId}`);
    } catch (err) {
      this.logger.error(
        `Failed to send status update email: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
