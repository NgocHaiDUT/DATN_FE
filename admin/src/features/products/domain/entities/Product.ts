/**
 * Product Brand
 */
export interface ProductBrand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

/**
 * Product Category
 */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
}

/**
 * Product Variant
 */
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  shade_hex?: string;
  size_label?: string;
  opacity?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Product Media
 */
export interface ProductMedia {
  id: number;
  product_id: number;
  url: string;
  type: string;
  sort_order: number;
  created_at: Date;
}

/**
 * Shop Info
 */
export interface ShopInfo {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
}

/**
 * Product entity - Core business object representing a cosmetic product.
 */
export interface Product {
  /** Unique identifier for the product */
  id: number;
  /** Product name */
  name: string;
  /** Product slug */
  slug: string;
  /** Product description */
  description?: string;
  /** How to use */
  how_to_use?: string;
  /** Shop ID that owns this product */
  shop_id: number;
  /** Shop information */
  shop?: ShopInfo;
  /** Brand ID */
  brand_id?: number;
  /** Brand information */
  brand?: ProductBrand;
  /** Product categories */
  product_categories?: Array<{
    category_id: number;
    category: ProductCategory;
  }>;
  /** Product variants */
  product_variants?: ProductVariant[];
  /** Product media */
  product_media?: ProductMedia[];
  /** Whether the product is published */
  is_published: boolean;
  /** Moderation status */
  moderation_status: 'pending' | 'approved' | 'rejected';
  /** Average rating */
  avg_rating?: number;
  /** Review count */
  review_count?: number;
  /** Has AR try-on capability */
  hasTryOn?: boolean;
  /** First image URL */
  first_image?: string;
  /** Rating (normalized) */
  rating?: number;
  /** Reviews count (normalized) */
  reviews?: number;
  /** In stock status */
  inStock?: boolean;
  /** Creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Input DTO for creating a new product
 */
export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  how_to_use?: string;
  shop_id: number;
  brand_id?: number;
  category_ids?: number[];
  is_published: boolean;
}

/**
 * Input DTO for updating an existing product
 */
export interface UpdateProductInput {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  how_to_use?: string;
  brand_id?: number;
  category_ids?: number[];
  is_published?: boolean;
}
