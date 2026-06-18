export interface LoginRequest {
  email: string;
  password: string;
  device_id: string;
  device_name: string;
  device_type?: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  phone?: string;
  device_register: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  code?: string; // For DEVICE_VERIFICATION_REQUIRED
  device_id?: string; // For DEVICE_VERIFICATION_REQUIRED
  user?: {
    id: number;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    story: string | null;
    role_id: number | null;
    firstlogin: boolean;
    is_active: boolean;
    permissions: string[];
    cartItemCount: number;
  };
}

export interface VerifyDeviceRequest {
  email: string;
  device_id: string;
  otp: string;
  device_name?: string;
}

export interface RefreshTokenRequest {
  token: string;
  device_id: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface ExchangeTokenRequest {
  code: string;
  device_id: string;
  device_name?: string;
}

export interface ExchangeTokenResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user?: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordFirstTimeRequest {
  email: string;
  temporaryPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export type User = {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  story: string | null;
  role_id: number | null;
  firstlogin?: boolean;
  is_active: boolean;
  permissions: string[];
  cartItemCount: number;
};
