import type { IUserRepository } from '../domain/repositories';
import type { RoleWithPermissions } from '../domain/entities';

/**
 * GetAllRolesWithPermissionsUseCase fetches all roles and their permissions
 */
export class GetAllRolesWithPermissionsUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(): Promise<RoleWithPermissions[]> {
    return await this.repository.getAllRolesWithPermissions();
  }
}
