/**
 * User entity represents a user in the system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  avatar?: string;
  joinedDate: string;
  totalOrders?: number;
  totalSpent?: number;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  addresses?: Array<{
    id: string;
    label?: string;
    recipient?: string;
    phone?: string;
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    is_default?: boolean;
    created_at?: string;
    ghn_province_id?: any;
    ghn_district_id?: any;
    ghn_ward_code?: any;
    full_address?: string;
  }>;
  lastLogin?: string;
  bio?: string;
}
