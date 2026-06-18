import type { IOrderRepository } from '../domain/repositories/IOrderRepository';
import type { Order, CreateOrderInput } from '../domain/entities/Order';

export class CreateOrderUseCase {
  private orderRepository: IOrderRepository;

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(input: CreateOrderInput): Promise<Order> {
    return this.orderRepository.createOrder(input);
  }
}
