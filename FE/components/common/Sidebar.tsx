"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  Camera,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/features/shop/useShop";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermissions } from "@/features/auth/usePermissions";
import { useI18n } from "@/lib/i18n/I18nContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const navigationItems: Array<{
  href: string;
  labelKey: TranslationKey;
  icon: any;
  permissions: string[];
}> = [
  {
    href: "/seller",
    labelKey: "sellerSidebar.overview",
    icon: Home,
    permissions: [PERMISSIONS.view_dashboard],
  },
  {
    href: "/seller/products",
    labelKey: "sellerSidebar.products",
    icon: Package,
    permissions: [PERMISSIONS.manage_product],
  },
  {
    href: "/seller/orders",
    labelKey: "sellerSidebar.orders",
    icon: ShoppingCart,
    permissions: [PERMISSIONS.manage_order],
  },
  {
    href: "/seller/messages",
    labelKey: "sellerSidebar.messages",
    icon: MessageCircle,
    permissions: [PERMISSIONS.chat_with_customer],
  },
  {
    href: "/seller/try-on-tester",
    labelKey: "sellerSidebar.tryOn",
    icon: Camera,
    permissions: [PERMISSIONS.try_on_tester],
  },
  {
    href: "/seller/settings",
    labelKey: "sellerSidebar.settings",
    icon: Settings,
    permissions: [PERMISSIONS.edit_profile_shop, PERMISSIONS.manage_shop_setting],
  },
  {
    href: "/seller/wallet",
    labelKey: "sellerSidebar.walletRevenue",
    icon: Wallet,
    permissions: [PERMISSIONS.view_dashboard],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { shop } = useShop();
  const { hasAnyPermission, isOwner, loading } = usePermissions();

  const canAccess = (item: any) => {
    if (isOwner) return true;
    if (!item.permissions?.length) return true;
    return hasAnyPermission(item.permissions);
  };

  const isDisabled = (item: any) => {
    if (isOwner) return false;
    if (!item.permissions?.length) return false;
    return !hasAnyPermission(item.permissions);
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          {shop?.logo_url ? (
            <img src={shop.logo_url} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#c27aff] to-[#fb64b6] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-semibold">{shop?.name || t('sellerSidebar.shop')}</h1>
            <p className="text-sm text-gray-500">{t('sellerSidebar.dashboard')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-6">{t('sellerSidebar.loading')}</div>
        ) : (
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              // Special handling for /seller root to avoid matching all /seller/* paths
              const active = item.href === "/seller" 
                ? pathname === "/seller" 
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const allowed = canAccess(item);
              const disabled = isDisabled(item);

              // Show all items but disable those without permission
              return (
                <li key={item.href}>
                  {disabled ? (
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition opacity-50 cursor-not-allowed",
                        "text-gray-400"
                      )}
                      title={t('sellerSidebar.noPermission')}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{t(item.labelKey)}</span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                        active
                          ? "bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
