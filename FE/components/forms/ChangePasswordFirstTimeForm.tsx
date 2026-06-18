'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useChangePasswordFirstTime } from "@/features/auth/useChangePasswordFirstTime";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/I18nContext";

export function ChangePasswordFirstTimeForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mutation = useChangePasswordFirstTime();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error(t('auth.pwdMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.pwdMismatch'));
      return;
    }

    try {
      await mutation.mutateAsync({ newPassword });
    } catch (err: any) {
      toast.error(err?.message || t('auth.changePwdFailed'));
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent className="p-6 space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t('auth.changingPwd') : t('auth.changePwd')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

