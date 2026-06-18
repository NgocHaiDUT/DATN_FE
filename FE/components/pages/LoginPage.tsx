'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Sparkles, Chrome, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLogin } from '@/features/auth/useLogin';
import { useGoogleLogin } from '@/features/auth/useGoogle';
import { DeviceVerificationModal } from './DeviceVerificationModal';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const loginMutation = useLogin(); // ✅ Get full mutation object
  const { loginWithGoogle } = useGoogleLogin();

  // Check for expired session message
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expiredMessage = sessionStorage.getItem('auth_expired_message');
      if (expiredMessage) {
        toast.error(expiredMessage);
        sessionStorage.removeItem('auth_expired_message');
      }
    }
  }, []);

  // ✅ Watch for device verification requirement
  useEffect(() => {
    if (loginMutation.data?.code === "DEVICE_VERIFICATION_REQUIRED" && loginMutation.data.device_id) {
      console.log('🔐 [LoginPage] Device verification required, showing modal');
      setDeviceId(loginMutation.data.device_id);
      setShowDeviceVerification(true);
    }
  }, [loginMutation.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      {
        email: email.trim(),
        password,
        _credentials: { email: email.trim(), password }
      },
      {
        onSuccess: (data: any) => {
          // Check if device verification is required
          if (data.code === "DEVICE_VERIFICATION_REQUIRED" && data.device_id) {
            setDeviceId(data.device_id);
            setShowDeviceVerification(true);
          }
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-white overflow-hidden">
      <div className="flex h-full w-full">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#c27aff] to-[#fb64b6] items-center justify-center">
          <div className="max-w-md text-center text-white px-16">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">BeautyAI</h2>
            <p className="text-lg text-white/90">
              Khám phá thế giới làm đẹp với công nghệ AI tiên tiến
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center h-full">
          <div className="w-full max-w-lg px-12">
            {/* Back to Home */}
            <div className="mb-4">
              <Link href={ROUTES.HOME} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Về trang chủ
              </Link>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-linear-to-r from-[#c27aff] to-[#fb64b6] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
                Đăng nhập
              </h1>
            </div>

            {/* Desktop Header */}
            <div className="my-4 flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
              <p className="text-gray-600">Chào mừng bạn trở lại</p>
            </div>

            {/* Form */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex items-center justify-center text-sm">
                    <Link href={ROUTES.AUTH.FORGOT_PASSWORD} className="text-purple-600 hover:text-purple-700 font-medium">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] hover:to-[#f550a8] text-white h-11 text-base font-medium disabled:opacity-60"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>

                  {/* Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">
                        Hoặc
                      </span>
                    </div>
                  </div>

                  {/* Social Sign In */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginWithGoogle}
                    className="w-full h-11 text-base"
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Đăng nhập với Google
                  </Button>

                  {/* Sign Up Link */}
                  <div className="text-center text-sm pt-2">
                    <span className="text-gray-600">Chưa có tài khoản? </span>
                    <Link href={ROUTES.AUTH.REGISTER} className="text-purple-600 hover:text-purple-700 font-medium">
                      Đăng ký
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Device Verification Modal */}
      {showDeviceVerification && deviceId && (
        <DeviceVerificationModal
          email={email}
          deviceId={deviceId}
          onClose={() => {
            setShowDeviceVerification(false);
            setDeviceId(null);
          }}
        />
      )}
    </div>
  );
}
