import type { IOrderRepository } from '../domain/repositories/IOrderRepository';
import type { Order, OrderQueryParams } from '../domain/entities/Order';

export class GetOrdersUseCase {
  private orderRepository: IOrderRepository;

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(params?: OrderQueryParams): Promise<{ orders: Order[]; total: number }> {
    return this.orderRepository.getOrders(params);
  }
}
