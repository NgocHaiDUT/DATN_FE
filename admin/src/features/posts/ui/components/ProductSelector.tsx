import { useState, useEffect, useCallback } from 'react';
import { productApi, type ApiProduct } from '../../../products/data/api/productApi';

const ASSET_BASE_ORIGIN = (() => {
    const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
    if (!raw) return '';
    try {
        return new URL(raw).origin;
    } catch {
        return '';
    }
})();

const normalizeAssetUrl = (url?: string): string => {
    if (!url) return '/placeholder-product.png';
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (!ASSET_BASE_ORIGIN) return url;
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${ASSET_BASE_ORIGIN}${normalizedPath}`;
};

/**
 * ProductSelectorProps - Props for ProductSelector component
 */
export interface ProductSelectorProps {
    selectedProductIds: number[];
    onProductsChange: (productIds: number[]) => void;
}

/**
 * ProductSelector - Component for searching and selecting products
 */
export function ProductSelector({ selectedProductIds, onProductsChange }: ProductSelectorProps) {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch products based on search
    const fetchProducts = useCallback(async (searchTerm: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await productApi.getProducts({
                search: searchTerm,
                limit: 20,
            });
            if (response.success && response.products) {
                setProducts(response.products);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError('Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and search handling
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(search);
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [search, fetchProducts]);

    // Load selected products details on mount or when selectedProductIds change
    useEffect(() => {
        const loadSelectedProducts = async () => {
            if (selectedProductIds.length === 0) {
                setSelectedProducts([]);
                return;
            }

            try {
                const response = await productApi.getProducts({ limit: 100 });
                if (response.success && response.products) {
                    const selectedProds = response.products.filter((p) =>
                        selectedProductIds.includes(p.id)
                    );
                    setSelectedProducts(selectedProds);
                }
            } catch (err) {
                console.error('Failed to load selected products:', err);
            }
        };

        loadSelectedProducts();
    }, [selectedProductIds]);

    const handleProductToggle = (product: ApiProduct) => {
        const isSelected = selectedProductIds.includes(product.id);

        if (isSelected) {
            // Remove product
            const newIds = selectedProductIds.filter(id => id !== product.id);
            const newProducts = selectedProducts.filter(p => p.id !== product.id);
            onProductsChange(newIds);
            setSelectedProducts(newProducts);
        } else {
            // Add product
            const newIds = [...selectedProductIds, product.id];
            const newProducts = [...selectedProducts, product];
            onProductsChange(newIds);
            setSelectedProducts(newProducts);
        }
    };

    const handleRemoveProduct = (productId: number) => {
        const newIds = selectedProductIds.filter(id => id !== productId);
        const newProducts = selectedProducts.filter(p => p.id !== productId);
        onProductsChange(newIds);
        setSelectedProducts(newProducts);
    };

    const getProductImage = (product: ApiProduct) => {
        return normalizeAssetUrl(product.product_media?.[0]?.url);
    };

    const getProductPrice = (product: ApiProduct) => {
        const price = product.product_variants?.[0]?.price;
        if (price === undefined || price === null) {
            return 'N/A';
        }
        const numericPrice = typeof price === 'string' ? Number(price) : price;
        return Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : 'N/A';
    };

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Attach Products (Optional)
                </label>
                <input
                    id="product-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search products to attach..."
                />

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {loading && (
                            <div className="p-4 text-center text-gray-500">Loading products...</div>
                        )}
                        {error && (
                            <div className="p-4 text-center text-red-500">{error}</div>
                        )}
                        {!loading && !error && products.length === 0 && (
                            <div className="p-4 text-center text-gray-500">No products found</div>
                        )}
                        {!loading && !error && products.length > 0 && (
                            <div className="py-2">
                                {products.map((product) => {
                                    const isSelected = selectedProductIds.includes(product.id);
                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleProductToggle(product)}
                                            className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            {/* Product Image */}
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                            {/* Product Info */}
                                            <div className="flex-1 text-left">
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="text-sm text-gray-500">{getProductPrice(product)}</div>
                                            </div>
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowDropdown(false)}
                            className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-200"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                        Selected Products ({selectedProducts.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedProducts.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                                <span>{product.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="hover:text-blue-900 focus:outline-none"
                                    aria-label={`Remove ${product.name}`}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
