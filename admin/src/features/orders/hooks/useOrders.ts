import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Order,
  OrderStatus,
  OrderQueryParams,
  CreateOrderInput,
} from '../domain/entities/Order';
import { OrderRepositoryImpl } from '../data/repositories';
import {
  GetOrdersUseCase,
  GetOrderByIdUseCase,
  CreateOrderUseCase,
  UpdateOrderStatusUseCase,
  DeleteOrderUseCase,
} from '../usecases';

export const useOrders = (initialFilters: OrderQueryParams = {}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<OrderQueryParams>(initialFilters);

  const repository = useMemo(() => new OrderRepositoryImpl(), []);
  const getOrdersUseCase = useMemo(() => new GetOrdersUseCase(repository), [repository]);
  const getOrderByIdUseCase = useMemo(() => new GetOrderByIdUseCase(repository), [repository]);
  const createOrderUseCase = useMemo(() => new CreateOrderUseCase(repository), [repository]);
  const updateOrderStatusUseCase = useMemo(() => new UpdateOrderStatusUseCase(repository), [repository]);
  const deleteOrderUseCase = useMemo(() => new DeleteOrderUseCase(repository), [repository]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrdersUseCase.execute(filters);
      setOrders(result.orders);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  }, [filters, getOrdersUseCase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderById = async (id: string) => getOrderByIdUseCase.execute(id);

  const createOrder = async (input: CreateOrderInput) => {
    const order = await createOrderUseCase.execute(input);
    await fetchOrders();
    return order;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    await updateOrderStatusUseCase.execute({ id, status });
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
  };

  const deleteOrder = async (id: string) => {
    await deleteOrderUseCase.execute(id);
    setOrders((prev) => prev.filter((order) => order.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  return {
    orders,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
  };
};
