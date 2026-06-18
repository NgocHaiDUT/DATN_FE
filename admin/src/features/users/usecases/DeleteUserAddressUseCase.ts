import type { IUserRepository } from '../domain/repositories';

/**
 * DeleteUserAddressUseCase handles deleting an address for a user
 */
export class DeleteUserAddressUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string, addressId: string): Promise<void> {
    return this.repository.deleteUserAddress(userId, addressId);
  }
}
