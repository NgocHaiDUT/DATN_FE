import type { Shop } from '../entities/Shop';

/**
 * IShopRepository defines the data-access contract for shops.
 * Implementations live in the data layer and handle I/O + mapping.
 */
export interface IShopRepository {
  /** Returns a list of shops with optional pagination and filters */
  list(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Shop[]; total: number }>;

  /** Get a single shop by id */
  getById(id: string): Promise<Shop | null>;

  /** Create a new shop */
  create(input: Partial<Shop>): Promise<Shop>;

  /** Update an existing shop */
  update(id: string, input: Partial<Shop>): Promise<Shop>;

  /** Update platform commission rate for a shop */
  updateCommissionRate(id: string, commissionRate: number): Promise<Shop>;

  /** Update platform commission rate for all shops */
  updateAllCommissionRates(commissionRate: number): Promise<{ updatedCount: number; commissionRate: number }>;

  /** Delete a shop */
  delete(id: string): Promise<void>;
}
