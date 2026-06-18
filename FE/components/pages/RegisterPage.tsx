'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Sparkles, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegister } from '@/features/auth/useRegister';
import { useGoogleLogin } from '@/features/auth/useGoogle';
import { ROUTES } from '@/constants/routes';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    agreeToTerms: false,
    agreeToMarketing: false,
  });
  const { mutate: register, isPending } = useRegister();
  const { loginWithGoogle } = useGoogleLogin();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      return;
    }

    register({
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || undefined,
    });
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

        {/* Right side - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center h-full">

          <div className="w-full max-w-2xl px-12">
            <div className="my-4 flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký</h1>
              <p className="text-gray-600">Tham gia BeautyAI ngay hôm nay</p>
            </div>
            {/* Form */}
            <Card className="border-0 shadow-xl">
              <CardContent className="">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="full_name"
                        placeholder="Nhập họ và tên của bạn"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại (Tuỳ chọn)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', !!checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-sm leading-5 cursor-pointer">
                        Tôi đồng ý với{' '}
                        <button
                          type="button"
                          className="text-purple-600 hover:text-purple-700 underline"
                        >
                          Điều khoản & Điều kiện
                        </button>{' '}
                        và{' '}
                        <button
                          type="button"
                          className="text-purple-600 hover:text-purple-700 underline"
                        >
                          Chính sách bảo mật
                        </button>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketing"
                        checked={formData.agreeToMarketing}
                        onCheckedChange={(checked) => handleInputChange('agreeToMarketing', !!checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="marketing" className="text-sm leading-5 cursor-pointer">
                        Tôi muốn nhận mẹo làm đẹp, cập nhật sản phẩm và ưu đãi qua email
                      </Label>
                    </div>
                  </div>

                  {/* Sign Up Button */}
                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] hover:to-[#f550a8] text-white h-11 text-base font-medium disabled:opacity-60"
                    disabled={isPending || !formData.agreeToTerms}
                  >
                    {isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
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

                  {/* Social Sign Up */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginWithGoogle}
                    className="w-full h-11 text-base"
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Đăng ký với Google
                  </Button>

                  {/* Sign In Link */}
                  <div className="text-center text-sm pt-2">
                    <span className="text-gray-600">Đã có tài khoản? </span>
                    <Link href={ROUTES.AUTH.LOGIN} className="text-purple-600 hover:text-purple-700 font-medium">
                      Đăng nhập
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
}
