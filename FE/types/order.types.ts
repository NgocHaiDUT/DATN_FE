// order.types.ts - Type definitions for orders

export interface OrderItem {
  id: number;
  product_id: number;
  variant_id?: number;
  name_snapshot: string;
  variant_snapshot?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  product?: {
    id: number;
    name: string;
    product_media?: Array<{
      id: number;
      url: string;
      media_type: string;
    }>;
    brand?: {
      id: number;
      name: string;
    };
  };
  variant?: {
    id: number;
    name: string;
    price: number;
  };
}

export interface OrderAddress {
  id: number;
  recipient: string;
  phone: string;
  street: string;
  ward?: string;
  district: string;
  province: string;
}

export interface OrderPayment {
  id: number;
  provider: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'refunded' | 'failed';
  transaction_id?: string;
}

export interface OrderShipment {
  id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  address_snapshot: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface Order {
  id: number;
  user_id: number;
  shop_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed';
  subtotal_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  note?: string;
  created_at: string;
  updated_at: string;
  
  shop?: {
    id: number;
    name: string;
    logo_url?: string;
  };
  
  order_items: OrderItem[];
  shipping_address?: OrderAddress;
  payments: OrderPayment[];
  shipments: OrderShipment[];
}

export interface CreateOrderRequest {
  userId: number;
  shipping_address_id: number;
  note?: string;
  payment_method?: string; // 'cod' | 'online'
}

export interface CreateOrderFromProductRequest {
  userId: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  shipping_address_id: number;
  note?: string;
  payment_method?: string;
}

export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface OrderResponse {
  success: boolean;
  order?: Order;
  message?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orders?: Array<{
    id: number;
    shop_id: number;
    total_amount: number;
  }>;
  message?: string;
}

// Status mapping for display
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền'
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thanh toán thất bại'
};

// Status colors for UI
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  confirmed: '#007AFF',
  processing: '#007AFF',
  shipped: '#32D74B',
  delivered: '#32D74B',
  cancelled: '#FF3B30',
  refunded: '#8E8E93'
};