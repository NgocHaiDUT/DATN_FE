import type { IUserRepository } from '../domain/repositories';
import type { PageInfo } from '../domain/entities';

/**
 * GetPageInfoUseCase fetches page info including roles and statistics
 */
export class GetPageInfoUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(): Promise<PageInfo> {
    return this.repository.getPageInfo();
  }
}
