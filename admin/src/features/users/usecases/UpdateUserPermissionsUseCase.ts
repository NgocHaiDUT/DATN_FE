import type { IUserRepository } from '../domain/repositories';

/**
 * UpdateUserPermissionsUseCase handles updating permissions for a user
 */
export class UpdateUserPermissionsUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string, permissionIds: number[]): Promise<void> {
    return await this.repository.updateUserPermissions(userId, permissionIds);
  }
}
