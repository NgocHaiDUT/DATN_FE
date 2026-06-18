/**
 * UserFilters for filtering user list
 */
export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}
