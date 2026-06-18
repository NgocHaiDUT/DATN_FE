import type {
  Order,
  OrderQueryParams,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from '../entities/Order';

export interface IOrderRepository {
  getOrders(params?: OrderQueryParams): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: string): Promise<Order>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
}
