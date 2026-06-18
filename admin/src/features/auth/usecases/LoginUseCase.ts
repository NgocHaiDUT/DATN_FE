import { authApi } from '../data/api/authApi'
import type { LoginResponse, VerifyDeviceResponse, RefreshTokenResponse } from '../data/api/authApi'

export const LoginUseCase = async (email: string, password: string): Promise<LoginResponse> => {
  return authApi.login(email, password)
}

export const VerifyDeviceUseCase = async (
  email: string,
  deviceId: string,
  otp: string,
): Promise<VerifyDeviceResponse> => {
  return authApi.verifyDevice(email, otp, deviceId)
}

export const RefreshTokenUseCase = async (): Promise<RefreshTokenResponse> => {
  return authApi.refreshAccessToken()
}

export const LogoutUseCase = async (allDevices: boolean = false): Promise<void> => {
  return authApi.logout(allDevices)
}
