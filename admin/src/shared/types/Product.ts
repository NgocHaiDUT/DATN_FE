/**
 * Product entity - shared type for products across the application
 */
export interface Product {
  /** Unique identifier for the product */
  id: string;
  /** Product name */
  name: string;
  /** Shop ID that owns this product */
  shopId: string;
  /** Product description */
  description?: string;
  /** Product price in VND */
  price: number;
  /** Product category (e.g., lipstick, foundation, skincare) */
  category: string;
  /** Product brand */
  brand?: string;
  /** Product image URL */
  imageUrl?: string;
  /** Stock quantity */
  stock: number;
  /** Whether the product is active/available */
  isActive: boolean;
  /** Product rating (0-5) */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
}
