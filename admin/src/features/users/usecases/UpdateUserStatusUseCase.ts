import type { IUserRepository } from '../domain/repositories';
import type { User } from '../domain/entities';

/**
 * UpdateUserStatusUseCase handles updating user status
 */
export class UpdateUserStatusUseCase {
  private userRepo: IUserRepository;

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Executes the use case to update user status
   */
  async execute(userId: string, status: 'active' | 'inactive' | 'banned'): Promise<User> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.userRepo.updateUserStatus(userId, status);
  }
}
