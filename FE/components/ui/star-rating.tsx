import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    max?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string;
    showText?: boolean;
}

export const StarRating = ({
    rating,
    max = 5,
    size = 16,
    interactive = false,
    onRatingChange,
    className,
    showText = false,
}: StarRatingProps) => {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[...Array(max)].map((_, index) => {
                const value = index + 1;
                const isFull = value <= rating;
                const isHalf = !isFull && value - 0.5 <= rating;

                return (
                    <div
                        key={index}
                        className={cn(interactive && "cursor-pointer hover:scale-110 transition-transform")}
                        onClick={() => interactive && onRatingChange?.(value)}
                    >
                        {isFull ? (
                            <Star
                                size={size}
                                className="fill-yellow-400 text-yellow-400"
                            />
                        ) : isHalf ? (
                            <div className="relative">
                                <Star
                                    size={size}
                                    className="text-gray-300 fill-gray-100"
                                />
                                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                    <Star
                                        size={size}
                                        className="fill-yellow-400 text-yellow-400"
                                    />
                                </div>
                            </div>
                        ) : (
                            <Star
                                size={size}
                                className="text-gray-300 fill-gray-100"
                            />
                        )}
                    </div>
                );
            })}
            {showText && <span className="text-sm font-medium ml-2">{rating}</span>}
        </div>
    );
};
