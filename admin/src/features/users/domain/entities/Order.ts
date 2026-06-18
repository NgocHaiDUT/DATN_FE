/**
 * Order entity represents an order in the system
 */
export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
}

/**
 * OrderItem represents an item in an order
 */
export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  thumbnail?: string;
}
