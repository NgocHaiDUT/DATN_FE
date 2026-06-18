export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode?: number;
}
