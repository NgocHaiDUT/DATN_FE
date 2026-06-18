"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVerifyDevice } from "@/features/auth/useVerifyDevice";

interface DeviceVerificationModalProps {
  email: string;
  deviceId: string;
  onClose: () => void;
}

export function DeviceVerificationModal({
  email,
  deviceId,
  onClose,
}: DeviceVerificationModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyDevice = useVerifyDevice();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      return;
    }

    verifyDevice.mutate(
      {
        email,
        device_id: deviceId,
        otp: otpString,
      },
      {
        onError: () => {
          // Reset OTP on error
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Xác minh thiết bị</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Chúng tôi đã gửi mã OTP 6 chữ số đến email <strong>{email}</strong>.
            Vui lòng nhập mã để xác minh thiết bị này.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="otp" className="mb-3 block">
                Mã OTP
              </Label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    disabled={verifyDevice.isPending}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={verifyDevice.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                disabled={otp.join("").length !== 6 || verifyDevice.isPending}
              >
                {verifyDevice.isPending ? "Đang xác minh..." : "Xác minh"}
              </Button>
            </div>
          </form>

          {verifyDevice.isError && (
            <p className="text-sm text-red-600 mt-4 text-center">
              {verifyDevice.error?.message || "Mã OTP không đúng hoặc đã hết hạn"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

