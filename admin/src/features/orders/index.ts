// Domain exports
export type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  CreateOrderInput,
  CreateOrderItemInput,
  UpdateOrderStatusInput,
  OrderQueryParams,
} from './domain/entities/Order';
export type { IOrderRepository } from './domain/repositories/IOrderRepository';

// Use cases
export {
  GetOrdersUseCase,
  GetOrderByIdUseCase,
  CreateOrderUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderUseCase,
} from './usecases';

// Data layer
export { OrderRepositoryImpl } from './data/repositories';

// Hooks
export { useOrders } from './hooks';

// UI
export { OrdersPage } from './ui/pages';
export { OrdersTable, OrderStatusBadge, OrdersFilters } from './ui/components';
