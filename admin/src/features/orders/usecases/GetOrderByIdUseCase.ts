import type { IOrderRepository } from '../domain/repositories/IOrderRepository';
import type { Order } from '../domain/entities/Order';

export class GetOrderByIdUseCase {
  private orderRepository: IOrderRepository;

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id: string): Promise<Order> {
    return this.orderRepository.getOrderById(id);
  }
}
