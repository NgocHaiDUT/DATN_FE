// Cart Types
import { Product, ProductVariant } from './product.types';

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price_snapshot: number;
  created_at: Date;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
  cart_items?: CartItem[];
}

export interface AddToCartRequest {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  cart?: Cart;
  error?: string;
}

export interface CartItemResponse {
  success: boolean;
  message?: string;
  cartItem?: CartItem;
  error?: string;
}
