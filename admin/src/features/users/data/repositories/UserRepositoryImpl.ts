import type { IUserRepository } from '../../domain/repositories';
import type { User, UserFilters } from '../../domain/entities';
import { UserApi } from '../api/userApi';

type ApiUser = {
  id: number;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
  firstlogin?: boolean | null;
  role?: { id: number; name: string } | null;
  role_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  totalOrders?: number;
  totalSpending?: number;
  story?: string | null;
  addresses?: Array<Record<string, any>>;
};

type PaginatedApiResponse<T> = {
  success?: boolean;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const toStatus = (user: ApiUser): User['status'] => {
  if (user.is_deleted) return 'banned';
  if (user.is_active === false) return 'inactive';
  return 'active';
};

const toRole = (user: ApiUser): User['role'] => {
  const roleName = user.role?.name?.toLowerCase();
  if (roleName === 'admin' || roleName === 'seller' || roleName === 'user') {
    return roleName as User['role'];
  }
  return 'user';
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toISOString();
  } catch {
    return String(value);
  }
};

const mapApiUserToDomain = (user: ApiUser): User => ({
  id: String(user.id),
  name: user.full_name || user.email,
  email: user.email,
  role: toRole(user),
  status: toStatus(user),
  avatar: user.avatar_url || undefined,
  joinedDate: formatDate(user.created_at) || '',
  totalOrders: user.totalOrders,
  totalSpent: user.totalSpending,
  phone: user.phone || undefined,
  // Map addresses array from API (if present) and build `full_address`
  addresses: Array.isArray((user as any).addresses)
    ? (user as any).addresses.map((a: any) => {
        const parts = [a.street, a.ward, a.district, a.province].filter((p: any) => p || p === 0);
        return {
          id: String(a.id),
          label: a.label,
          recipient: a.recipient,
          phone: a.phone,
          province: a.province,
          district: a.district,
          ward: a.ward,
          street: a.street,
          is_default: a.is_default,
          created_at: a.created_at,
          ghn_province_id: a.ghn_province_id,
          ghn_district_id: a.ghn_district_id,
          ghn_ward_code: a.ghn_ward_code,
          full_address: parts.join(', '),
        };
      })
    : undefined,
  // Backwards compatibility: single-address fields use first address if available
  address: Array.isArray((user as any).addresses) && (user as any).addresses[0]
    ? [ (user as any).addresses[0].street, (user as any).addresses[0].ward, (user as any).addresses[0].district, (user as any).addresses[0].province ]
        .filter((p: any) => p || p === 0)
        .join(', ')
    : undefined,
  city: Array.isArray((user as any).addresses) && (user as any).addresses[0]
    ? (user as any).addresses[0].district
    : undefined,
  country: Array.isArray((user as any).addresses) && (user as any).addresses[0]
    ? (user as any).addresses[0].province
    : undefined,
  lastLogin: undefined,
  bio: user.story || undefined,
});

const buildApiFilters = (filters?: UserFilters) => {
  if (!filters) return undefined;
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== 'all') {
    params.is_active = filters.status === 'active' ? 'true' : 'false';
  }
  if (filters.role && filters.role !== 'all') {
    const asNumber = Number(filters.role);
    if (!Number.isNaN(asNumber)) {
      params.role_id = String(asNumber);
    }
  }
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  return params;
};

const unwrapData = <T>(response: any): T => (response && response.data ? response.data : response);

/**
 * UserRepositoryImpl implements IUserRepository using real API
 * Must receive accessToken from hook caller
 */
export class UserRepositoryImpl implements IUserRepository {
  private api: UserApi;
  private accessToken: string | null = null;

  constructor(api: UserApi, accessToken?: string | null) {
    this.api = api;
    this.accessToken = accessToken || null;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  async getUsers(filters?: UserFilters): Promise<{ users: User[]; total: number }> {
    const apiFilters = buildApiFilters(filters);
    const res = await this.api.getUsers(apiFilters, this.accessToken);
    const typed = res as PaginatedApiResponse<ApiUser[]>;
    const data = unwrapData<ApiUser[]>(typed) as ApiUser[];
    const users = Array.isArray(data) ? data.map(mapApiUserToDomain) : [];
    const total = typed?.pagination?.total ?? users.length;
    return { users, total };
  }

  async getUserById(id: string): Promise<User> {
    const res = await this.api.getUserById(id, this.accessToken);
    const data = unwrapData<ApiUser>(res) as ApiUser;
    return mapApiUserToDomain(data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.deleteUser(id, this.accessToken);
  }

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'banned'): Promise<User> {
    const res = await this.api.updateUserStatus(id, status, this.accessToken);
    const data = unwrapData<ApiUser>(res) as ApiUser;
    const overrides: Partial<ApiUser> = {};
    if (status === 'banned') {
      overrides.is_deleted = true;
      overrides.is_active = false;
    } else if (status === 'inactive') {
      overrides.is_active = false;
      overrides.is_deleted = false;
    } else if (status === 'active') {
      overrides.is_active = true;
      overrides.is_deleted = false;
    }
    return mapApiUserToDomain({ ...data, ...overrides });
  }

  async getPageInfo(): Promise<import('../../domain/entities').PageInfo> {
    const res = await this.api.getPageInfo(this.accessToken);
    const data = unwrapData<any>(res);
    return {
      totalUsers: data.totalUsers ?? 0,
      activeUsers: data.activeUsers ?? 0,
      inactiveUsers: data.inactiveUsers ?? 0,
      roles: Array.isArray(data.roles) ? data.roles.map((r: any) => ({
        id: r.id,
        name: r.name,
      })) : [],
    };
  }

  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    is_active: boolean;
    role_id: number;
    avatar?: File;
  }): Promise<any> {
    return await this.api.createUser(userData, this.accessToken);
  }

  async getAllRolesWithPermissions(): Promise<import('../../domain/entities').RoleWithPermissions[]> {
    const res = await this.api.getAllRolesWithPermissions(this.accessToken);
    const data = unwrapData<any>(res);
    const roles = Array.isArray(data) ? data : (data?.roles || []);
    return roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      permissions: Array.isArray(role.permissions) 
        ? role.permissions.map((perm: any) => ({
            id: perm.id,
            name: perm.name,
            description: perm.description || undefined,
          }))
        : [],
    }));
  }

  async getUserPermissions(userId: string): Promise<import('../../domain/entities').UserPermission[]> {
    const res = await this.api.getUserPermissions(userId, this.accessToken);
    const data = unwrapData<any>(res);
    const permissions = Array.isArray(data) ? data : (data?.permissions || []);
    return permissions.map((perm: any) => ({
      id: perm.id,
      name: perm.name,
      description: perm.description || undefined,
      granted_at: perm.granted_at || undefined,
    }));
  }

  async updateUserPermissions(userId: string, permissionIds: number[]): Promise<void> {
    await this.api.updateUserPermissions(userId, permissionIds, this.accessToken);
  }

  async updateUser(userId: string, userData: {
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
    const res = await this.api.updateUser(userId, userData, this.accessToken);
    const data = unwrapData<ApiUser>(res) as ApiUser;
    return mapApiUserToDomain(data);
  }

  async createUserAddress(userId: string, addressData: {
    label: string;
    receiver_name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
  }): Promise<any> {
    return await this.api.createUserAddress(userId, addressData, this.accessToken);
  }

  async updateUserAddress(userId: string, addressId: string, addressData: {
    label?: string;
    receiver_name?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    is_default?: boolean;
  }): Promise<any> {
    return await this.api.updateUserAddress(userId, addressId, addressData, this.accessToken);
  }

  async deleteUserAddress(userId: string, addressId: string): Promise<void> {
    await this.api.deleteUserAddress(userId, addressId, this.accessToken);
  }
}
