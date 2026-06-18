/**
 * OrderItem represents a single product in an order
 */
export interface OrderItem {
  /** Product ID */
  productId: string;
  /** Product name snapshot at order time */
  productName: string;
  /** Price at order time */
  price: number;
  /** Quantity ordered */
  quantity: number;
  /** Subtotal for this item */
  subtotal: number;
}

/**
 * Order entity - represents a customer purchase
 */
export interface Order {
  /** Unique order ID */
  id: string;
  /** Shop ID that fulfilled this order */
  shopId: string;
  /** Customer user ID */
  customerId: string;
  /** Customer name snapshot */
  customerName: string;
  /** List of items in the order */
  items: OrderItem[];
  /** Total order amount */
  total: number;
  /** Order status */
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'completed';
  /** Order date */
  orderDate: string;
  /** Payment method */
  paymentMethod?: 'cod' | 'vnpay' | 'wallet' | 'cash' | 'card' | 'transfer' | 'e-wallet';
  /** Shipping address */
  shippingAddress?: string;
}
