const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/**
 * DashboardApi handles all HTTP requests for dashboard data
 */
export class DashboardApi {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  private headers(): HeadersInit {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  /**
   * Fetches dashboard statistics from API
   */
  async getStats() {
    const response = await fetch(`${API_BASE}/analytics/admin/stats`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return response.json();
  }

  /**
   * Fetches revenue trend data from API
   */
  async getRevenueTrend() {
    const response = await fetch(`${API_BASE}/analytics/admin/revenue-trend`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch revenue trend');
    }
    return response.json();
  }

  /**
   * Fetches product categories data from API
   */
  async getProductCategories() {
    const response = await fetch(`${API_BASE}/analytics/admin/product-categories`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch product categories');
    }
    return response.json();
  }
}
