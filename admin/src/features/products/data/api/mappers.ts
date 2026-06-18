import type { Product } from '../../domain/entities/Product';

export interface ProductDTO {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  how_to_use?: string;
  shop_id: number | string;
  brand_id?: number | string;
  brand?: Product['brand'];
  product_categories?: Product['product_categories'];
  product_variants?: Product['product_variants'];
  product_media?: Product['product_media'];
  is_published?: boolean;
  moderation_status?: Product['moderation_status'];
  avg_rating?: number | string;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export function mapProductDtoToEntity(dto: ProductDTO): Product {
  return {
    id: Number(dto.id),
    name: dto.name,
    slug: dto.slug || String(dto.id),
    description: dto.description,
    how_to_use: dto.how_to_use,
    shop_id: Number(dto.shop_id),
    brand_id: dto.brand_id !== undefined ? Number(dto.brand_id) : undefined,
    brand: dto.brand,
    product_categories: dto.product_categories,
    product_variants: dto.product_variants,
    product_media: dto.product_media,
    is_published: Boolean(dto.is_published),
    moderation_status: dto.moderation_status || 'pending',
    avg_rating: dto.avg_rating !== undefined ? Number(dto.avg_rating) : undefined,
    review_count: dto.review_count,
    first_image: dto.product_media?.[0]?.url,
    inStock: dto.product_variants?.some((variant) => variant.stock > 0) || false,
    created_at: dto.created_at ? new Date(dto.created_at) : new Date(),
    updated_at: dto.updated_at ? new Date(dto.updated_at) : new Date(),
  };
}

export function mapProductEntityToDto(product: Product): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    how_to_use: product.how_to_use,
    shop_id: product.shop_id,
    brand_id: product.brand_id,
    brand: product.brand,
    product_categories: product.product_categories,
    product_variants: product.product_variants,
    product_media: product.product_media,
    is_published: product.is_published,
    moderation_status: product.moderation_status,
    avg_rating: product.avg_rating,
    review_count: product.review_count,
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };
}
