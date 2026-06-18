import type { IDashboardRepository } from '../domain/repositories';
import type { RevenueTrend } from '../domain/entities';

/**
 * GetRevenueTrendUseCase handles fetching revenue trend data
 */
export class GetRevenueTrendUseCase {
  private dashboardRepo: IDashboardRepository;

  constructor(dashboardRepo: IDashboardRepository) {
    this.dashboardRepo = dashboardRepo;
  }

  /**
   * Executes the use case to retrieve revenue trend for last 6 months
   */
  async execute(): Promise<RevenueTrend[]> {
    return this.dashboardRepo.getRevenueTrend();
  }
}
