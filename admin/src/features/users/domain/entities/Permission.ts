/**
 * Permission entity represents a single permission in the system
 */
export interface Permission {
  id: number;
  name: string;
  description?: string;
}

/**
 * RoleWithPermissions includes the role and its associated permissions
 */
export interface RoleWithPermissions {
  id: number;
  name: string;
  permissions: Permission[];
}

/**
 * UserPermission represents permissions specific to a user
 */
export interface UserPermission {
  id: number;
  name: string;
  description?: string;
  granted_at?: string;
}
