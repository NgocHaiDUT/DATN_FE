import type { Product, CreateProductInput, UpdateProductInput } from '../entities/Product';

/**
 * IProductRepository - Interface defining product data operations.
 * Implementations handle data retrieval and persistence.
 */
export interface IProductRepository {
  /**
   * Get all products with optional filtering and pagination
   */
  getProducts(params?: {
    page?: number;
    limit?: number;
    shopId?: string;
    category?: number;
    brand?: number;
    search?: string;
    is_published?: boolean;
    moderation_status?: 'pending' | 'approved' | 'rejected';
  }): Promise<{ products: Product[]; total: number }>;

  /**
   * Get a single product by ID
   */
  getProductById(id: string): Promise<Product>;

  /**
   * Create a new product
   */
  createProduct(input: CreateProductInput): Promise<Product>;

  /**
   * Update an existing product
   */
  updateProduct(input: UpdateProductInput): Promise<Product>;

  /**
   * Delete a product by ID
   */
  deleteProduct(id: string): Promise<void>;

  /**
   * Update product stock quantity
   * Note: This is handled through variants in the new API
   */
  updateStock(id: string): Promise<Product>;
}
