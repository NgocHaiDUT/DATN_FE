"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import type { ChatbotRecommendedProduct } from "@/types/chatbot.types";
import { cn } from "@/lib/utils";

interface ChatbotProductCardsProps {
  products?: ChatbotRecommendedProduct[];
  compact?: boolean;
}

function formatPrice(value?: number | null) {
  if (value == null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function productHref(product: ChatbotRecommendedProduct) {
  if (product.url?.startsWith("/")) return product.url;
  return `/product/${product.slug || product.id}`;
}

export function ChatbotProductCards({ products, compact = false }: ChatbotProductCardsProps) {
  if (!products?.length) return null;

  return (
    <div className={cn("mt-3 space-y-2", compact ? "max-w-full" : "max-w-md")}>
      {products.map((product) => (
        <Link
          key={product.id}
          href={productHref(product)}
          className="group flex overflow-hidden rounded-lg border border-pink-100 bg-white text-left shadow-sm transition hover:border-pink-300 hover:shadow-md"
        >
          <div className={cn("flex-shrink-0 bg-gray-100", compact ? "h-20 w-20" : "h-24 w-24")}>
            <ImageWithFallback
              src={product.image_url || "/placeholder-product.jpg"}
              alt={product.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 flex-1 p-3">
            <div className="flex items-start gap-2">
              <ShoppingBag className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-500" />
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-pink-700">
                {product.name}
              </p>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">
              {product.brand?.name || product.shop?.name || "MakeCare"}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-bold text-pink-600">
                {formatPrice(product.price_from)}
              </span>
              {product.compare_at_price && product.compare_at_price > (product.price_from || 0) ? (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
