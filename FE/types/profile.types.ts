import { ApiResponse } from './api.types';

// User Profile Information
export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  phone?: string;
  story?: string;
  firstlogin?: boolean;
  QR_Payment?: string | null;
  vietqr_bank_code?: string | null;
  vietqr_account_number?: string | null;
  vietqr_account_name?: string | null;
  vietqr_is_enabled?: boolean | null;
  vietqr_addinfo_prefix?: string | null;
  vietqr_template?: string | null;
}

// Update Profile DTOs
export interface UpdateFullnameDto {
  userId: string | number;
  fullName: string;
}

export interface UpdatePhoneDto {
  userId: string | number;
  phone: string;
}

export interface UpdateStoryDto {
  userId: string | number;
  story: string;
}

export interface UpdatePasswordDto {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

// VietQR Settings
export interface VietqrSettings {
  Id: number;
  vietqr_bank_code?: string | null;
  vietqr_account_number?: string | null;
  vietqr_account_name?: string | null;
  vietqr_is_enabled?: boolean | null;
  vietqr_addinfo_prefix?: string | null;
  vietqr_template?: string | null;
  QR_Payment?: string | null;
}

export interface UpdateVietqrSettingsDto {
  vietqr_bank_code?: string;
  vietqr_account_number?: string;
  vietqr_account_name?: string;
  vietqr_is_enabled?: boolean;
  vietqr_addinfo_prefix?: string;
}

// Response Types
export interface UserProfileResponse extends ApiResponse {
  data?: UserProfile;
}

export interface UploadAvatarResponse extends ApiResponse {
  avatarUrl?: string;
}

export interface UploadQrPaymentResponse extends ApiResponse {
  qrUrl?: string;
}

export interface VietqrSettingsResponse extends ApiResponse {
  data?: VietqrSettings;
}

// User Profile with Statistics (for profile page)
export interface UserProfileWithStats extends UserProfile {
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  likes_count?: number;
}

export interface UserProfileWithStatsResponse extends ApiResponse {
  data?: UserProfileWithStats;
}
