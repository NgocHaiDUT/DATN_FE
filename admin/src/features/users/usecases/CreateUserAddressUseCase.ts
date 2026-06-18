import type { IUserRepository } from '../domain/repositories';

/**
 * CreateUserAddressUseCase handles creating a new address for a user
 */
export class CreateUserAddressUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  async execute(userId: string, addressData: {
    label: string;
    receiver_name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
  }): Promise<any> {
    return this.repository.createUserAddress(userId, addressData);
  }
}
