import type {
  Order,
  OrderQueryParams,
  CreateOrderInput,
  UpdateOrderStatusInput,
} from '../../domain/entities/Order';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  return data;
}

function mapOrder(dto: any): Order {
  const payment = dto.payments?.[0];
  return {
    id: String(dto.id),
    shopId: String(dto.shop?.id ?? dto.shop_id ?? ''),
    customerId: String(dto.user?.id ?? dto.user_id ?? ''),
    customerName: dto.user?.full_name || dto.user?.email || 'Unknown customer',
    items: (dto.order_items || []).map((item: any) => ({
      productId: String(item.product_id ?? item.product?.id ?? ''),
      productName: item.name_snapshot || item.product?.name || 'Unknown product',
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      subtotal: Number(item.line_total || 0),
    })),
    total: Number(dto.total_amount || 0),
    status: dto.status,
    orderDate: dto.created_at,
    paymentMethod: payment?.provider,
    shippingAddress: dto.shipping_address
      ? [
          dto.shipping_address.street,
          dto.shipping_address.ward,
          dto.shipping_address.district,
          dto.shipping_address.province,
        ].filter(Boolean).join(', ')
      : undefined,
  };
}

export class OrderRepositoryImpl implements IOrderRepository {
  async getOrders(params?: OrderQueryParams): Promise<{ orders: Order[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.shopId) query.set('shopId', params.shopId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const data = await fetchWithAuth(`/order/admin/orders${query.toString() ? `?${query}` : ''}`);
    return {
      orders: (data.orders || []).map(mapOrder),
      total: data.pagination?.total ?? data.total ?? 0,
    };
  }

  async getOrderById(id: string): Promise<Order> {
    const data = await fetchWithAuth(`/order/admin/orders/${encodeURIComponent(id)}`);
    const order = data.order || data.data || data;
    return mapOrder(order);
  }

  async createOrder(_input: CreateOrderInput): Promise<Order> {
    throw new Error('Admin order creation is not supported by the backend API');
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order> {
    const data = await fetchWithAuth(`/order/admin/orders/${encodeURIComponent(input.id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: input.status }),
    });
    return mapOrder(data.order || data.data || { id: input.id, status: input.status });
  }

  async deleteOrder(_id: string): Promise<void> {
    throw new Error('Admin order deletion is not supported by the backend API');
  }
}
