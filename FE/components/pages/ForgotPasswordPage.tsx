'use client';

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@/features/auth/useForgotPassword";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) return;
    try {
      await mutation.mutateAsync({ email: email.trim() });
      setSent(true);
    } catch (err) {
      // errors handled by hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-r from-[#c27aff] to-[#fb64b6] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-linear-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">Quên mật khẩu</h1>
          <p className="text-gray-600 mt-2">Nhập email để đặt lại mật khẩu</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
                <div>
                  <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? "Đang gửi..." : "Gửi email đặt lại"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  <Link href={ROUTES.AUTH.LOGIN} className="text-purple-600">Quay lại đăng nhập</Link>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-green-600 font-medium">Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.</p>
                <div className="mt-4">
                  <Link href={ROUTES.AUTH.LOGIN} className="text-purple-600">Quay lại đăng nhập</Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

