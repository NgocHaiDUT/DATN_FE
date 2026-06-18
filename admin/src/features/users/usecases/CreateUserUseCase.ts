import type { IUserRepository } from '../domain/repositories';

/**
 * CreateUserUseCase handles the business logic for creating a new user
 */
export class CreateUserUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    is_active: boolean;
    role_id: number;
    avatar?: File;
  }): Promise<any> {
    return this.repository.createUser(userData);
  }
}
