import type { IOrderRepository } from '../domain/repositories/IOrderRepository';
import type { Order, UpdateOrderStatusInput } from '../domain/entities/Order';

export class UpdateOrderStatusUseCase {
  private orderRepository: IOrderRepository;

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(input: UpdateOrderStatusInput): Promise<Order> {
    return this.orderRepository.updateOrderStatus(input);
  }
}
