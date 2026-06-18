export interface ShopDto {
  id: number | string;
  name: string;
  slug?: string;
  owner?: { id: number | string; email?: string; full_name?: string };
  seller_id?: string;
  description?: string;
  staffs?: Array<{ user_id: number | string }>;
  staff_count?: number;
  product_count?: number;
  is_verified?: boolean;
  is_active?: boolean;
  commission_rate?: number | string;
}

export interface BulkCommissionRateDto {
  updated_count?: number;
  commission_rate?: number | string;
}

export interface ListShopsResponse {
  data: ShopDto[];
  total: number;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function handleJsonResponse(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
}

function headers(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const shopsApi = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ListShopsResponse> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const res = await fetch(`${API_BASE}/shop/list${qs.toString() ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: headers(),
    });
    const payload = await handleJsonResponse(res);
    return {
      data: payload.data || [],
      total: payload.pagination?.total ?? payload.total ?? 0,
    };
  },

  async getById(id: string): Promise<ShopDto> {
    const res = await fetch(`${API_BASE}/shop/${encodeURIComponent(id)}/details`, {
      headers: headers(),
    });
    const payload = await handleJsonResponse(res);
    return payload.data || payload;
  },

  async create(_payload: Partial<ShopDto>): Promise<ShopDto> {
    void _payload;
    throw new Error('Admin shop creation is not supported by the backend API');
  },

  async update(id: string, payload: Partial<ShopDto>): Promise<ShopDto> {
    const res = await fetch(`${API_BASE}/shop/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleJsonResponse(res);
    return data.data || data;
  },

  async updateCommissionRate(id: string, commissionRate: number): Promise<ShopDto> {
    const res = await fetch(`${API_BASE}/shop/${encodeURIComponent(id)}/commission-rate`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_rate: commissionRate }),
    });
    const data = await handleJsonResponse(res);
    return data.data || data;
  },

  async updateAllCommissionRates(commissionRate: number): Promise<BulkCommissionRateDto> {
    const res = await fetch(`${API_BASE}/shop/commission-rate/all`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_rate: commissionRate }),
    });
    const data = await handleJsonResponse(res);
    return data.data || data;
  },

  async delete(_id: string): Promise<void> {
    void _id;
    throw new Error('Admin shop deletion is not supported by the backend API');
  },
};
