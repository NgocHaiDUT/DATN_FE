import type { IUserRepository } from '../domain/repositories';
import type { User } from '../domain/entities';

/**
 * UpdateUserUseCase handles updating user information
 */
export class UpdateUserUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string, userData: {
    avatar?: File | null;
    email?: string;
    full_name?: string;
    phone?: string;
    story?: string;
    is_active?: boolean;
    firstlogin?: boolean;
    role_id?: number;
    password?: string;
  }): Promise<User> {
    return this.repository.updateUser(userId, userData);
  }
}
