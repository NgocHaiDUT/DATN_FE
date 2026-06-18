import type { IProductRepository } from '../domain/repositories/IProductRepository';

/**
 * DeleteProductUseCase - Deletes a product by ID.
 */
export class DeleteProductUseCase {
  private productRepository: IProductRepository;

  constructor(productRepository: IProductRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the use case to delete a product
   */
  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Product ID is required');
    }
    await this.productRepository.deleteProduct(id);
  }
}
