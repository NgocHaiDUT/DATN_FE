import type { Shop } from '../../domain/entities/Shop';
import type { IShopRepository } from '../../domain/repositories/IShopRepository';
import { shopsApi, type ShopDto } from '../api/shopsApi';

/**
 * ShopRepositoryImpl implements IShopRepository using the shopsApi.
 * It is responsible for DTO -> Entity mapping.
 */
export class ShopRepositoryImpl implements IShopRepository {
  private dtoToEntity(dto: ShopDto): Shop {
    return {
      id: String(dto.id),
      name: dto.name,
      sellerId: String(dto.seller_id ?? dto.owner?.id ?? ''),
      description: dto.description,
      commissionRate: dto.commission_rate !== undefined ? Number(dto.commission_rate) : undefined,
      isActive: dto.is_active ?? dto.is_verified ?? true,
      staffIds: dto.staffs?.map((staff) => String(staff.user_id)) ?? [],
      staffCount: dto.staff_count ?? dto.staffs?.length ?? 0,
      productCount: dto.product_count ?? 0,
      productIds: [],
    };
  }

  async list(params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Shop[]; total: number }> {
    const res = await shopsApi.list(params);
    return { data: res.data.map(this.dtoToEntity), total: res.total };
  }

  async getById(id: string): Promise<Shop | null> {
    const dto = await shopsApi.getById(id);
    return this.dtoToEntity(dto);
  }

  async create(input: Partial<Shop>): Promise<Shop> {
    const payload: Partial<ShopDto> = {
      name: input.name,
      seller_id: input?.sellerId,
      description: input.description,
      is_active: input.isActive,
    };
    const dto = await shopsApi.create(payload);
    return this.dtoToEntity(dto);
  }

  async update(id: string, input: Partial<Shop>): Promise<Shop> {
    const payload: Partial<ShopDto> = {
      name: input.name,
      description: input.description,
      is_active: input.isActive,
    };
    const dto = await shopsApi.update(id, payload);
    return this.dtoToEntity(dto);
  }

  async updateCommissionRate(id: string, commissionRate: number): Promise<Shop> {
    const dto = await shopsApi.updateCommissionRate(id, commissionRate);
    return this.dtoToEntity(dto);
  }

  async updateAllCommissionRates(commissionRate: number): Promise<{ updatedCount: number; commissionRate: number }> {
    const dto = await shopsApi.updateAllCommissionRates(commissionRate);
    return {
      updatedCount: dto.updated_count ?? 0,
      commissionRate: dto.commission_rate !== undefined ? Number(dto.commission_rate) : commissionRate,
    };
  }

  async delete(id: string): Promise<void> {
    return shopsApi.delete(id);
  }
}
