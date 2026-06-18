import type { IProductRepository } from '../domain/repositories/IProductRepository';
import type { Product } from '../domain/entities/Product';

/**
 * GetProductsUseCase - Retrieves products with optional filtering.
 */
export class GetProductsUseCase {
  private productRepository: IProductRepository;

  constructor(productRepository: IProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case to get products
   */
  async execute(params?: {
    page?: number;
    limit?: number;
    shopId?: string;
    category?: number;
    brand?: number;
    search?: string;
    is_published?: boolean;
    moderation_status?: 'pending' | 'approved' | 'rejected';
  }): Promise<{ products: Product[]; total: number }> {
    return this.productRepository.getProducts(params);
  }
}
