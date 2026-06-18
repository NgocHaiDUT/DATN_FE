import type { User, UserFilters, PageInfo, RoleWithPermissions, UserPermission } from '../entities';

/**
 * IUserRepository defines the contract for user data access
 */
export interface IUserRepository {
  /**
   * Fetches list of users with filters
   */
  getUsers(filters?: UserFilters): Promise<{ users: User[]; total: number }>;

  /**
   * Fetches a single user by ID
   */
  getUserById(id: string): Promise<User>;

  /**
   * Deletes a user by ID
   */
  deleteUser(id: string): Promise<void>;

  /**
   * Updates user status
   */
  updateUserStatus(id: string, status: 'active' | 'inactive' | 'banned'): Promise<User>;

  /**
   * Fetches page info including roles and statistics
   */
  getPageInfo(): Promise<PageInfo>;

  /**
   * Creates a new user
   */
  createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    is_active: boolean;
    role_id: number;
    avatar?: File;
  }): Promise<any>;

  /**
   * Fetches all roles with their permissions
   */
  getAllRolesWithPermissions(): Promise<RoleWithPermissions[]>;

  /**
   * Fetches all permissions for a specific user
   */
  getUserPermissions(userId: string): Promise<UserPermission[]>;

  /**
   * Updates permissions for a specific user
   */
  updateUserPermissions(userId: string, permissionIds: number[]): Promise<void>;

  /**
   * Updates a user's information
   */
  updateUser(userId: string, userData: {
    avatar?: File | null;
    email?: string;
    full_name?: string;
    phone?: string;
    story?: string;
    is_active?: boolean;
    firstlogin?: boolean;
    role_id?: number;
    password?: string;
  }): Promise<User>;

  /**
   * Creates a new address for a user
   */
  createUserAddress(userId: string, addressData: {
    label: string;
    receiver_name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
  }): Promise<any>;

  /**
   * Updates an address for a user
   */
  updateUserAddress(userId: string, addressId: string, addressData: {
    label?: string;
    receiver_name?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    is_default?: boolean;
  }): Promise<any>;

  /**
   * Deletes an address for a user
   */
  deleteUserAddress(userId: string, addressId: string): Promise<void>;
}
