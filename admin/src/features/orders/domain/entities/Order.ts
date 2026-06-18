import type { Order as SharedOrder, OrderItem as SharedOrderItem } from '../../../../shared/types/Order';

export type Order = SharedOrder;
export type OrderItem = SharedOrderItem;
export type OrderStatus = Order['status'];
export type PaymentMethod = NonNullable<Order['paymentMethod']>;

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  shopId: string;
  customerId: string;
  customerName: string;
  items: CreateOrderItemInput[];
  paymentMethod?: PaymentMethod;
  shippingAddress?: string;
}

export interface UpdateOrderStatusInput {
  id: string;
  status: OrderStatus;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  shopId?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  search?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}
