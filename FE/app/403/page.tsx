'use client';

import Link from 'next/link';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function ForbiddenPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-linear-to-r from-[#c27aff] to-[#fb64b6] flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-linear-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
              403
            </CardTitle>
            <CardDescription className="text-lg">
              {t('error403.title')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            {t('error403.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-linear-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] hover:to-[#e55aa8] text-white"
            >
              <Link href={ROUTES.HOME}>
                <Home className="h-4 w-4" />
                {t('error403.goHome')}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('error403.goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
