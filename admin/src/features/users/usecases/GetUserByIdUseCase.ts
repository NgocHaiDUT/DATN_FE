import type { IUserRepository } from '../domain/repositories';
import type { User } from '../domain/entities';

/**
 * GetUserByIdUseCase handles fetching a single user by ID
 */
export class GetUserByIdUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  /**
   * Executes the use case to get user by ID
   * @param id - User ID
   * @returns Promise<User>
   */
  async execute(id: string): Promise<User> {
    return this.repository.getUserById(id);
  }
}
