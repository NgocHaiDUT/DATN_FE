import type { IProductRepository } from '../domain/repositories/IProductRepository';
import type { Product, UpdateProductInput } from '../domain/entities/Product';

/**
 * UpdateProductUseCase - Updates an existing product.
 */
export class UpdateProductUseCase {
  private productRepository: IProductRepository;

  constructor(productRepository: IProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case to update a product
   */
  async execute(input: UpdateProductInput): Promise<Product> {
    if (!input.id) {
      throw new Error('Product ID is required');
    }

    return this.productRepository.updateProduct(input);
  }
}
