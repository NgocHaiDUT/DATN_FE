import type { IDashboardRepository } from '../domain/repositories';
import type { ProductCategory } from '../domain/entities';

/**
 * GetProductCategoriesUseCase handles fetching product category distribution
 */
export class GetProductCategoriesUseCase {
  private dashboardRepo: IDashboardRepository;

  constructor(dashboardRepo: IDashboardRepository) {
    this.dashboardRepo = dashboardRepo;
  }

  /**
   * Executes the use case to retrieve product categories data
   */
  async execute(): Promise<ProductCategory[]> {
    return this.dashboardRepo.getProductCategories();
  }
}
