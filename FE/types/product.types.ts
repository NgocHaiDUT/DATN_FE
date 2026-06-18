// Product Types
export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: Date;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  created_at: Date;
  parent?: Category;
  children?: Category[];
  productCount?: number;
}

export interface ProductMedia {
  id: number;
  product_id: number;
  url: string;
  type: string;
  sort_order: number;
  created_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string | null;
  shade_hex: string | null;
  size_label: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCategory {
  product_id: number;
  category_id: number;
  category: Category;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title: string | null;
  content: string | null;
  media_url: string | null;
  created_at: Date;
  is_verified_purchase: boolean;
  user: {
    id: number;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Shop {
  id: number;
  name: string;
  logo_url: string | null;
  is_verified: boolean;
}

export interface Product {
  id: number;
  shop_id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  how_to_use: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'removed';
  is_published: boolean;
  is_deleted?: boolean;
  deleted_at?: string | Date | null;
  avg_rating: number | null;
  review_count: number;
  created_at: Date;
  updated_at: Date;
  brand?: Brand;
  shop?: Shop;
  product_media?: ProductMedia[];
  product_variants?: ProductVariant[];
  product_categories?: ProductCategory[];
  reviews?: Review[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
}

export interface ProductsResponse {
  success: boolean;
  products?: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  product?: Product;
  message?: string;
  error?: string;
}

export interface BrandsResponse {
  success: boolean;
  brands?: Brand[];
  message?: string;
  error?: string;
}

export interface CategoriesResponse {
  success: boolean;
  categories?: Category[];
  message?: string;
  error?: string;
}
