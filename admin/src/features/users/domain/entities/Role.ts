/**
 * Role entity represents a user role in the system
 */
export interface Role {
  id: number;
  name: string;
}

/**
 * PageInfo represents the metadata returned by page-info API
 */
export interface PageInfo {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roles: Role[];
}
