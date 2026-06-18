import type { IUserRepository } from '../domain/repositories';
import type { UserPermission } from '../domain/entities';

/**
 * GetUserPermissionsUseCase fetches all permissions for a specific user
 */
export class GetUserPermissionsUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string): Promise<UserPermission[]> {
    return await this.repository.getUserPermissions(userId);
  }
}
