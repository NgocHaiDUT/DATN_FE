import type { IProductRepository } from '../../domain/repositories/IProductRepository';
import type { Product, CreateProductInput, UpdateProductInput } from '../../domain/entities/Product';
import { productApi, type ApiProduct } from '../api/productApi';

const ASSET_BASE_ORIGIN = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
})();

function normalizeAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!ASSET_BASE_ORIGIN) return url;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${ASSET_BASE_ORIGIN}${normalizedPath}`;
}

/**
 * Map API product to domain entity
 */
function mapApiProductToEntity(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description,
    how_to_use: apiProduct.how_to_use,
    shop_id: apiProduct.shop_id,
    shop: apiProduct.shop,
    brand_id: apiProduct.brand_id,
    brand: apiProduct.brand
      ? {
          id: apiProduct.brand.id,
          name: apiProduct.brand.name,
          slug: apiProduct.brand.slug ?? '',
          logo_url: apiProduct.brand.logo_url,
        }
      : undefined,
    product_categories: apiProduct.product_categories?.map((productCategory) => ({
      category_id: productCategory.category_id,
      category: {
        id: productCategory.category.id,
        name: productCategory.category.name,
        slug: productCategory.category.slug ?? '',
        parent_id: productCategory.category.parent_id,
      },
    })),
    product_variants: apiProduct.product_variants?.map(v => ({
      ...v,
      product_id: apiProduct.id,
      sku: v.sku ?? '',
      name: v.name ?? 'Default',
      price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
      compare_at_price: v.compare_at_price
        ? (typeof v.compare_at_price === 'string' ? parseFloat(v.compare_at_price) : v.compare_at_price)
        : undefined,
      shade_hex: v.shade_hex || undefined,
      size_label: v.size_label || undefined,
      opacity: v.opacity || undefined,
      is_active: v.is_active ?? true,
      created_at: new Date(v.created_at),
      updated_at: new Date(v.updated_at),
    })),
    product_media: apiProduct.product_media?.map((m, index) => ({
      ...m,
      id: m.id ?? index,
      type: m.type ?? 'image',
      url: normalizeAssetUrl(m.url) ?? m.url,
      product_id: apiProduct.id,
      created_at: new Date(m.created_at),
    })),
    is_published: apiProduct.is_published,
    moderation_status: apiProduct.moderation_status,
    avg_rating: typeof apiProduct.avg_rating === 'string' ? parseFloat(apiProduct.avg_rating) : apiProduct.avg_rating,
    review_count: apiProduct.review_count,
    hasTryOn: apiProduct.hasTryOn,
    first_image: normalizeAssetUrl(apiProduct.first_image),
    rating: typeof apiProduct.rating === 'string' ? parseFloat(apiProduct.rating) : apiProduct.rating,
    reviews: apiProduct.reviews,
    inStock: apiProduct.inStock,
    created_at: new Date(apiProduct.created_at),
    updated_at: new Date(apiProduct.updated_at),
  };
}

/**
 * ProductRepositoryImpl - Implementation using real API.
 */
export class ProductRepositoryImpl implements IProductRepository {
  /**
   * Get all products with optional filtering and pagination
   */
  async getProducts(params?: {
    page?: number;
    limit?: number;
    shopId?: string;
    category?: number;
    brand?: number;
    search?: string;
    is_published?: boolean;
    moderation_status?: 'pending' | 'approved' | 'rejected';
  }): Promise<{ products: Product[]; total: number }> {
    if (params?.shopId) {
      const response = await productApi.getShopProductsForManagement(params.shopId, {
        page: params.page,
        limit: params.limit,
        search: params.search,
        category: params.category,
        brand: params.brand,
        is_published: params.is_published,
        moderation_status: params.moderation_status,
      });

      const apiProducts = response.data?.products ?? response.products ?? [];
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch shop products');
      }

      const products = apiProducts.map(mapApiProductToEntity);
      const total = response.data?.pagination?.total ?? response.pagination?.total ?? products.length;

      return { products, total };
    }

    const response = await productApi.getProducts({
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      category: params?.category,
      brand: params?.brand,
      is_published: params?.is_published,
      moderation_status: params?.moderation_status,
    });

    if (!response.success || !response.products) {
      throw new Error(response.message || 'Failed to fetch products');
    }

    const products = response.products.map(mapApiProductToEntity);
    const total = response.pagination?.total || products.length;

    return { products, total };
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      throw new Error('Invalid product ID');
    }

    const response = await productApi.getProductById(productId);

    if (!response.success || !response.product) {
      throw new Error(response.message || `Product with ID ${id} not found`);
    }

    return mapApiProductToEntity(response.product);
  }

  /**
   * Create a new product
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const response = await productApi.createProduct({
      shop_id: input.shop_id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      how_to_use: input.how_to_use,
      brand_id: input.brand_id,
      category_ids: input.category_ids,
      is_published: input.is_published,
    });

    if (!response.success || !response.product) {
      throw new Error(response.message || 'Failed to create product');
    }

    return mapApiProductToEntity(response.product);
  }

  /**
   * Update an existing product
   */
  async updateProduct(input: UpdateProductInput): Promise<Product> {
    const response = await productApi.updateProduct(input.id, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      how_to_use: input.how_to_use,
      brand_id: input.brand_id,
      category_ids: input.category_ids,
      is_published: input.is_published,
    });

    if (!response.success || !response.product) {
      throw new Error(response.message || 'Failed to update product');
    }

    return mapApiProductToEntity(response.product);
  }

  /**
   * Delete a product by ID
   */
  async deleteProduct(id: string): Promise<void> {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      throw new Error('Invalid product ID');
    }

    const response = await productApi.deleteProduct(productId);

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete product');
    }
  }

  /**
   * Update product stock quantity
   * Note: This is handled through variants in the new API
   */
  async updateStock(id: string): Promise<Product> {
    // For now, we'll just fetch the product
    // In a real implementation, you'd update the variant stock
    return this.getProductById(id);
  }
}
