import type { IProductRepository } from '../domain/repositories/IProductRepository';
import type { Product, CreateProductInput } from '../domain/entities/Product';

/**
 * CreateProductUseCase - Creates a new product.
 */
export class CreateProductUseCase {
  private productRepository: IProductRepository;

  constructor(productRepository: IProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case to create a product
   */
  async execute(input: CreateProductInput): Promise<Product> {
    // Validate input
    if (!input.name || input.name.trim() === '') {
      throw new Error('Product name is required');
    }
    if (!input.shop_id) {
      throw new Error('Shop ID is required');
    }

    if (input.brand_id !== undefined && input.brand_id <= 0) {
      throw new Error('Brand ID must be a positive number');
    }

    if (input.category_ids && input.category_ids.some((id) => id <= 0)) {
      throw new Error('Category IDs must be positive numbers');
    }

    return this.productRepository.createProduct(input);
  }
}
