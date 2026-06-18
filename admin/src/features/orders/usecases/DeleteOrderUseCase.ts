import type { IOrderRepository } from '../domain/repositories/IOrderRepository';

export class DeleteOrderUseCase {
  private orderRepository: IOrderRepository;

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id: string): Promise<void> {
    return this.orderRepository.deleteOrder(id);
  }
}
