import type { IShopRepository } from '../domain/repositories/IShopRepository';
import type { Shop } from '../domain/entities/Shop';

/**
 * GetShopsUseCase returns a paginated list of shops.
 */
export class GetShopsUseCase {
  private shopRepo: IShopRepository;

  constructor(shopRepo: IShopRepository) {
    this.shopRepo = shopRepo;
  }

  async execute(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Shop[]; total: number }> {
    return this.shopRepo.list(params);
  }
}
