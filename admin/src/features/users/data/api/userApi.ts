import { authFetch } from '../../../auth/data/api/httpClient';

/**
 * UserApi handles all HTTP requests for user data
 */
export class UserApi {
  private baseUrl: string;
  private onTokenUpdate?: (newToken: string) => void;

  constructor(baseUrl?: string, onTokenUpdate?: (newToken: string) => void) {
    const envBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
    let resolved = (baseUrl ?? envBase) || '/api';
    if (!resolved.startsWith('/') && !/^https?:\/\//i.test(resolved)) {
      resolved = `http://${resolved}`;
    }
    this.baseUrl = resolved.replace(/\/$/, '');
    this.onTokenUpdate = onTokenUpdate;
  }

  /**
   * Fetches users list from API
   */
  async getUsers(filters?: Record<string, unknown>, accessToken?: string | null) {
    const queryParams = new URLSearchParams((filters || {}) as Record<string, string>).toString();
    const url = `${this.baseUrl}/admin/users${queryParams ? `?${queryParams}` : ''}`;
    console.log('[UserApi] getUsers -> request', { url, filters });
    const response = await authFetch(
      url,
      { method: 'GET' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] getUsers <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] getUsers error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to fetch users: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Fetches a single user by ID
   */
  async getUserById(id: string, accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/${id}`;
    console.log('[UserApi] getUserById -> request', { url });
    const response = await authFetch(
      url,
      { method: 'GET' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] getUserById <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] getUserById error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to fetch user: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Deletes a user
   */
  async deleteUser(id: string, accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/${id}`;
    console.log('[UserApi] deleteUser -> request', { url });
    const response = await authFetch(
      url,
      { method: 'DELETE' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] deleteUser <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] deleteUser error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to delete user: ${response.status} ${text}`);
    }
  }

  /**
   * Updates user status
   */
  async updateUserStatus(
    id: string,
    status: 'active' | 'inactive' | 'banned',
    accessToken?: string | null
  ) {
    const url = `${this.baseUrl}/admin/users/${id}/status`;
    const body = JSON.stringify({ status });
    console.log('[UserApi] updateUserStatus -> request', { url, body });
    const response = await authFetch(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] updateUserStatus <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] updateUserStatus error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to update user status: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Fetches page info including roles and statistics
   */
  async getPageInfo(accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/page-info`;
    console.log('[UserApi] getPageInfo -> request', { url });
    const response = await authFetch(
      url,
      { method: 'GET' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] getPageInfo <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] getPageInfo error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to fetch page info: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Creates a new user
   */
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    is_active: boolean;
    role_id: number;
    avatar?: File;
  }, accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users`;
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('full_name', userData.full_name);
    formData.append('phone', userData.phone);
    formData.append('is_active', String(userData.is_active));
    formData.append('firstlogin', 'true');
    formData.append('role_id', String(userData.role_id));
    if (userData.avatar) {
      formData.append('avatar', userData.avatar);
    }

    console.log('[UserApi] createUser -> request', { url, userData: { ...userData, avatar: userData.avatar?.name } });
    const response = await authFetch(
      url,
      {
        method: 'POST',
        body: formData,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] createUser <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] createUser error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to create user: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Fetches all roles and their permissions
   */
  async getAllRolesWithPermissions(accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/roles/all`;
    console.log('[UserApi] getAllRolesWithPermissions -> request', { url });
    const response = await authFetch(
      url,
      { method: 'GET' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] getAllRolesWithPermissions <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] getAllRolesWithPermissions error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to fetch roles with permissions: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Fetches all permissions for a specific user
   */
  async getUserPermissions(userId: string, accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/${userId}/permissions`;
    console.log('[UserApi] getUserPermissions -> request', { url, userId });
    const response = await authFetch(
      url,
      { method: 'GET' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] getUserPermissions <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] getUserPermissions error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to fetch user permissions: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Updates permissions for a specific user
   */
  async updateUserPermissions(userId: string, permissionIds: number[], accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/${userId}/permissions`;
    const body = JSON.stringify({ permission_ids: permissionIds });
    console.log('[UserApi] updateUserPermissions -> request', { url, userId, permissionIds });
    const response = await authFetch(
      url,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] updateUserPermissions <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] updateUserPermissions error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to update user permissions: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Updates a user's information
   */
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
  }, accessToken?: string | null) {
    const url = `${this.baseUrl}/admin/users/${userId}`;
    const formData = new FormData();
    
    if (userData.avatar !== undefined) {
      if (userData.avatar) {
        formData.append('avatar', userData.avatar);
      }
    }
    if (userData.email !== undefined) formData.append('email', userData.email);
    if (userData.full_name !== undefined) formData.append('full_name', userData.full_name);
    if (userData.phone !== undefined) formData.append('phone', userData.phone);
    if (userData.story !== undefined) formData.append('story', userData.story);
    if (userData.is_active !== undefined) formData.append('is_active', String(userData.is_active));
    if (userData.firstlogin !== undefined) formData.append('firstlogin', String(userData.firstlogin));
    if (userData.role_id !== undefined) formData.append('role_id', String(userData.role_id));
    if (userData.password !== undefined) formData.append('password', userData.password);

    console.log('[UserApi] updateUser -> request', { url, userData: { ...userData, avatar: userData.avatar?.name } });
    const response = await authFetch(
      url,
      {
        method: 'PATCH',
        body: formData,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] updateUser <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] updateUser error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to update user: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Creates a new address for a user
   */
  async createUserAddress(userId: string, addressData: {
    label: string;
    receiver_name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
  }, accessToken?: string | null) {
    const url = `${this.baseUrl}/address/users/${userId}`;
    const body = JSON.stringify(addressData);
    console.log('[UserApi] createUserAddress -> request', { url, addressData });
    const response = await authFetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] createUserAddress <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] createUserAddress error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to create user address: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Updates an address for a user
   */
  async updateUserAddress(userId: string, addressId: string, addressData: {
    label?: string;
    receiver_name?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    is_default?: boolean;
  }, accessToken?: string | null) {
    const url = `${this.baseUrl}/address/users/${userId}/${addressId}`;
    const body = JSON.stringify(addressData);
    console.log('[UserApi] updateUserAddress -> request', { url, addressData });
    const response = await authFetch(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] updateUserAddress <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] updateUserAddress error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to update user address: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }

  /**
   * Deletes an address for a user
   */
  async deleteUserAddress(userId: string, addressId: string, accessToken?: string | null) {
    const url = `${this.baseUrl}/address/users/${userId}/${addressId}`;
    console.log('[UserApi] deleteUserAddress -> request', { url });
    const response = await authFetch(
      url,
      { method: 'DELETE' },
      accessToken ?? null,
      this.onTokenUpdate || (() => {})
    );
    const text = await response.clone().text().catch(() => '');
    let parsed: any = undefined;
    try { parsed = text ? JSON.parse(text) : undefined; } catch (_) { parsed = undefined; }
    console.log('[UserApi] deleteUserAddress <- response', { url, status: response.status, ok: response.ok, body: parsed ?? text });
    if (!response.ok) {
      console.error('[UserApi] deleteUserAddress error', { url, status: response.status, body: parsed ?? text });
      throw new Error(`Failed to delete user address: ${response.status} ${text}`);
    }
    return parsed ?? null;
  }
}
