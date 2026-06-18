import type { IUserRepository } from '../domain/repositories';

/**
 * UpdateUserAddressUseCase handles updating an address for a user
 */
export class UpdateUserAddressUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string, addressId: string, addressData: {
    label?: string;
    receiver_name?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    is_default?: boolean;
  }): Promise<any> {
    return this.repository.updateUserAddress(userId, addressId, addressData);
  }
}
