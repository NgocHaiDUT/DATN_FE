import type { IProductRepository } from '../domain/repositories/IProductRepository';
import type { Product } from '../domain/entities/Product';

/**
 * GetProductByIdUseCase - Retrieves a single product by ID.
 */
export class GetProductByIdUseCase {
  private productRepository: IProductRepository;

  constructor(productRepository: IProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case to get a product by ID
   */
  async execute(id: string): Promise<Product> {
    if (!id) {
      throw new Error('Product ID is required');
    }
    return this.productRepository.getProductById(id);
  }
}
