"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Brand } from "@/types/shop";
import { resolveMediaUrl } from "@/lib/media";

interface BrandCardProps {
    brand: Brand;
    onClick?: (brand: Brand) => void;
}

export function BrandCard({ brand, onClick }: BrandCardProps) {
    const logo = resolveMediaUrl(brand.logo_url);

    return (
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onClick?.(brand)}
        >
            <CardContent className="p-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                        src={logo}
                        alt={brand.name}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/next.svg';
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
