/**
 * Shop entity represents a seller's storefront in the domain layer.
 * It contains metadata about the shop and its staff members.
 */
export interface Shop {
  /** Unique identifier for the shop (maps to seller id) */
  id: string;
  /** Human friendly shop name */
  name: string;
  /** Seller id that owns this shop */
  sellerId: string;
  /** Optional description */
  description?: string;
  /** Platform commission rate as decimal. Example: 0.03 = 3% */
  commissionRate?: number;
  /** Staff count returned by the backend list/detail API */
  staffCount?: number;
  /** Product count returned by the backend list/detail API */
  productCount?: number;
  /** List of staff member user IDs - references to User entities */
  staffIds: string[];
  /** List of product IDs belonging to this shop */
  productIds: string[];
  /** Whether the shop is active */
  isActive: boolean;
}
