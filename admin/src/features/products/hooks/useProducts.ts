import { useState } from 'react';
import type { Product, CreateProductInput, UpdateProductInput } from '../domain/entities/Product';
import { GetProductsUseCase } from '../usecases/GetProductsUseCase';
import { GetProductByIdUseCase } from '../usecases/GetProductByIdUseCase';
import { CreateProductUseCase } from '../usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../usecases/DeleteProductUseCase';
import { ProductRepositoryImpl } from '../data/repositories/ProductRepositoryImpl';

/**
 * useProducts - React hook for product operations
 * Connects UI to use cases following Clean Architecture
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize repository and use cases
  const productRepo = new ProductRepositoryImpl();
  const getProductsUC = new GetProductsUseCase(productRepo);
  const getProductByIdUC = new GetProductByIdUseCase(productRepo);
  const createProductUC = new CreateProductUseCase(productRepo);
  const updateProductUC = new UpdateProductUseCase(productRepo);
  const deleteProductUC = new DeleteProductUseCase(productRepo);

  /**
   * Fetch products with optional filters
   */
  const fetchProducts = async (params?: {
    page?: number;
    limit?: number;
    shopId?: string;
    category?: number;
    brand?: number;
    search?: string;
    is_published?: boolean;
    moderation_status?: 'pending' | 'approved' | 'rejected';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProductsUC.execute(params);
      setProducts(result.products);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch a single product by ID
   */
  const fetchProductById = async (id: string): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      return await getProductByIdUC.execute(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new product
   */
  const createProduct = async (input: CreateProductInput): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const newProduct = await createProductUC.execute(input);
      setProducts(prev => [...prev, newProduct]);
      setTotal(prev => prev + 1);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing product
   */
  const updateProduct = async (input: UpdateProductInput): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProductUC.execute(input);
      setProducts(prev => 
        prev.map(p => p.id === updated.id ? updated : p)
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a product
   */
  const deleteProduct = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await deleteProductUC.execute(id);
      setProducts(prev => prev.filter(p => String(p.id) !== id));
      setTotal(prev => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    total,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
