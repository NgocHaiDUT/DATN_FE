import type { IUserRepository } from '../domain/repositories';

/**
 * DeleteUserUseCase handles deleting a user
 */
export class DeleteUserUseCase {
  private userRepo: IUserRepository;

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Executes the use case to delete a user
   */
  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.userRepo.deleteUser(userId);
  }
}
