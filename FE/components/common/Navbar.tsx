'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/features/auth/useMe';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Sparkles,
  Package,
  MessageCircle,
  ArrowUpLeft,
  Heart
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { usePermissions } from '@/features/auth/usePermissions';
import { useAutocomplete } from '@/features/search/useSearch';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const pathname = usePathname();
  const permissions = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestions } = useAutocomplete(debouncedQuery);

  // Danh sách các route cần ẩn Navbar
  const hiddenNavbarRoutes = [
    // Auth routes
    ROUTES.AUTH.LOGIN,
    ROUTES.AUTH.REGISTER,
    ROUTES.AUTH.FORGOT_PASSWORD,
    ROUTES.AUTH.FIRST_CHANGER_PASSWORD,
    '/change-password',
    // Admin routes
    '/admin',
    // Seller routes
    '/seller',
    // Error pages
    '/403',
    '/404',
    '/500',
  ];

  // Kiểm tra xem pathname có bắt đầu với bất kỳ route nào trong danh sách không
  const shouldHideNavbar = hiddenNavbarRoutes.some(route => pathname.startsWith(route));

  // Luôn gọi useMe() nhưng query sẽ được disable khi ở trang lỗi
  useMe();

  useEffect(() => {
    if (params.get('g') === '1') {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  }, [params, queryClient]);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const hasShopPermission = permissions.hasPermission(PERMISSIONS.view_dashboard);

  if (shouldHideNavbar) {
    return null;
  }

  const uniqueCartItems = user?.cartItemCount || 0;
  const hasCartItems = uniqueCartItems > 0;
  const cartDisplayCount = hasCartItems
    ? uniqueCartItems > 99
      ? '99+'
      : uniqueCartItems
    : null;

  const navItems: { id: string; label: string; to: string; icon?: any }[] = [
    { id: 'shop', label: t('navbar.shop'), to: '/shop', icon: ShoppingBag },
    { id: 'ai-studio', label: t('navbar.aiStudio'), to: '/ai-studio', icon: Sparkles },
  ];

  if (isAuthenticated) {
    navItems.push({ id: 'chat', label: t('navbar.chat'), to: '/chat', icon: MessageCircle });
    if (hasShopPermission) {
      navItems.push({
        id: 'seller',
        label: t('navbar.sellerChannel'),
        to: '/seller',
        icon: Package,
      });
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60 font-sans">
      <div className="flex h-16 items-center px-4 lg:px-8">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 rounded-full bg-linear-to-r from-[#c27aff] to-[#fb64b6] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-medium">Beauty</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 mr-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.id}
                href={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive
                  ? 'bg-linear-to-r from-[#c27aff] to-[#fb64b6] text-white font-bold'
                  : 'hover:bg-gray-100 text-gray-700'
                  }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('navbar.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchQuery.trim()) {
                    const isShopPath = pathname.startsWith('/shop');
                    const searchBasePath = isShopPath ? ROUTES.SHOP.SEARCH : ROUTES.SEARCH;
                    router.push(`${searchBasePath}?q=${encodeURIComponent(searchQuery.trim())}`);
                    setShowSuggestions(false);
                  }
                }
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions && (suggestions.length > 0 || debouncedQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.length > 0 ? (
                  <>
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('navbar.searchSuggestions')}</div>
                    {suggestions.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                        onClick={() => {
                          setSearchQuery(suggestion.keyword || suggestion);
                          const isShopPath = pathname.startsWith('/shop');
                          const searchBasePath = isShopPath ? ROUTES.SHOP.SEARCH : ROUTES.SEARCH;
                          router.push(`${searchBasePath}?q=${encodeURIComponent(suggestion.keyword || suggestion)}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Search className="h-3.5 w-3.5 text-slate-300 group-hover:text-pink-500 transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{suggestion.keyword || suggestion}</span>
                        </div>
                        <ArrowUpLeft className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-0.5" />
                      </div>
                    ))}
                  </>
                ) : debouncedQuery.length >= 2 ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-slate-400">{t('navbar.noSuggestions')}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Click outside to close */}
            {showSuggestions && (
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/order">
                <Button variant="ghost" size="icon" title={t('navbar.myOrders')}>
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" title="Wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {hasCartItems && (
                    <Badge className="absolute -top-2 -right-2 min-h-5 min-w-5 flex items-center justify-center p-0 bg-linear-to-r from-[#c27aff] to-[#fb64b6] text-[11px]">
                      {cartDisplayCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage
                    src={user?.avatar_url || ''}
                    alt={user?.full_name || 'User'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-linear-to-r from-[#c27aff] to-[#fb64b6] text-white">
                    {(user?.full_name?.[0] ||
                      user?.email?.[0] ||
                      'U'
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Link href={ROUTES.AUTH.LOGIN}>
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900"
                >
                  {t('navbar.login')}
                </Button>
              </Link>
              <Link href={ROUTES.AUTH.REGISTER}>
                <Button className="bg-linear-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5]  text-white">
                  {t('navbar.register')}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.id}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-linear-to-r from-[#c27aff] to-[#fb64b6] text-white font-bold'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {item.label}
                </Link>
              );
            })}

            <div className="border-t pt-4 mt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Package className="h-5 w-5" />
                    {t('navbar.myOrders')}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between w-full px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5" />
                      {t('navbar.cart')}
                    </div>
                    {hasCartItems && (
                      <Badge className="bg-linear-to-r from-[#c27aff] to-[#fb64b6]">
                        {cartDisplayCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={user?.avatar_url || ''}
                        alt={user?.full_name || 'User'}
                      />
                      <AvatarFallback className="bg-linear-to-r from-[#c27aff] to-[#fb64b6] text-white text-xs">
                        {(user?.full_name?.[0] ||
                          user?.email?.[0] ||
                          'U'
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {t('navbar.profile')}
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center w-full"
                    >
                      {t('navbar.login')}
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="flex items-center justify-center w-full bg-linear-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] text-white">
                      {t('navbar.register')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
