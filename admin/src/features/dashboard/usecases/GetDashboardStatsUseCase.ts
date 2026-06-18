import type { IDashboardRepository } from '../domain/repositories';
import type { DashboardStats } from '../domain/entities';

/**
 * GetDashboardStatsUseCase handles fetching dashboard statistics
 */
export class GetDashboardStatsUseCase {
  private dashboardRepo: IDashboardRepository;

  constructor(dashboardRepo: IDashboardRepository) {
    this.dashboardRepo = dashboardRepo;
  }

  /**
   * Executes the use case to retrieve dashboard stats
   */
  async execute(): Promise<DashboardStats> {
    return this.dashboardRepo.getStats();
  }
}
