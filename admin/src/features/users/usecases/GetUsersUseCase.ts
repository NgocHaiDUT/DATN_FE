import type { IUserRepository } from '../domain/repositories';
import type { User, UserFilters } from '../domain/entities';

/**
 * GetUsersUseCase handles fetching list of users
 */
export class GetUsersUseCase {
  private userRepo: IUserRepository;

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Executes the use case to retrieve users list
   */
  async execute(filters?: UserFilters): Promise<{ users: User[]; total: number }> {
    return this.userRepo.getUsers(filters);
  }
}
