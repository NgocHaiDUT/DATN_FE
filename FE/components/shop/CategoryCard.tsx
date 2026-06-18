"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@/types/shop";

export interface CategoryCardProps {
    name: string;
    icon: string;
    productCount?: string | number;
    onClick?: () => void;
    color?: string;
}

export function CategoryCard({ name, icon, productCount, onClick, color }: CategoryCardProps) {
    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={onClick}
        >
            <CardContent className="p-6 text-center space-y-3 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${color || 'from-purple-400 to-indigo-400'} opacity-5`} />
                <div className="relative">
                    <div className="text-3xl mb-2">{icon}</div>
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                    {productCount && <p className="text-sm text-gray-500">{productCount}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
