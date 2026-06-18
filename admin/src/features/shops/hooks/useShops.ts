import { useEffect, useState } from 'react';
import type { Shop } from '../domain/entities/Shop';
import { GetShopsUseCase } from '../usecases/GetShopsUseCase';
import { ShopRepositoryImpl } from '../data/repositories/ShopRepositoryImpl';

/**
 * useShops hook provides a simple adapter for listing shops.
 * Returns { data, loading, error, refetch }.
 */
export const useShops = (params?: { page?: number; limit?: number; search?: string }) => {
  const [data, setData] = useState<Shop[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const repo = new ShopRepositoryImpl();
  const useCase = new GetShopsUseCase(repo);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await useCase.execute(params);
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      // Clear data on error so UI doesn't show misleading empty state
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page, params?.limit, params?.search]);

  return { data, total, loading, error, refetch: fetchData };
};
