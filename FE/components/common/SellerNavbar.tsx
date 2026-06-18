"use client";

import { Search, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

import { useMe } from "@/features/auth/useMe";
import { useShop } from "@/features/shop/useShop";
import { usePermissions } from "@/features/auth/usePermissions";
import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth/useLogout";
import { NotificationDropdown } from "@/components/common/NotificationDropdown";
import { useI18n } from "@/lib/i18n/I18nContext";
type NavbarProps = {
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function SellerNavbar({
    sidebarOpen,
    setSidebarOpen,
}: NavbarProps) {
    const [mounted, setMounted] = useState(false);
    useMe();

    const router = useRouter();
    
    useEffect(() => {
        setMounted(true);
    }, []);
    const logout = useLogout();
    const { t } = useI18n();

    const { shop, isLoading, getShopInitials } = useShop();
    const { isOwner } = usePermissions();

    const handleSignOut = async () => {
        await logout();
    };

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </Button>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t('sellerNavbar.searchPlaceholder')}
                            className="pl-10 w-80 max-w-sm"
                        />
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                    <NotificationDropdown />

                    {mounted && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {!isLoading && shop?.logo_url ? (
                                        <img
                                            src={shop.logo_url}
                                            alt="Shop logo"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#c27aff] to-[#fb64b6] flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {getShopInitials()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {shop?.name || "Beauty Shop"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {isOwner ? t('sellerNavbar.owner') : t('sellerNavbar.staff')}
                                        </p>
                                    </div>

                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => router.push("/")}>
                                    {t('sellerNavbar.backToUser')}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={handleSignOut}
                                >
                                    {t('sellerNavbar.logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
