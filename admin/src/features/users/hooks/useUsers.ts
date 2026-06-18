import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import type { User, UserFilters, Role, PageInfo } from '../domain/entities';
import { UserRepositoryImpl } from '../data/repositories';
import { UserApi } from '../data/api';
import { GetUsersUseCase, DeleteUserUseCase, UpdateUserStatusUseCase, GetPageInfoUseCase, CreateUserUseCase } from '../usecases';

/**
 * useUsers hook provides user list data and actions
 */
export const useUsers = () => {
  const { token, refreshSession } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  // Callback to update token in context when authFetch auto-refreshes
  const handleTokenUpdate = useCallback(async () => {
    await refreshSession();
  }, [refreshSession]);

  // Initialize repository and use cases with token
  const api = new UserApi(undefined, handleTokenUpdate);
  const repository = new UserRepositoryImpl(api, token);
  const getUsersUseCase = new GetUsersUseCase(repository);
  const deleteUserUseCase = new DeleteUserUseCase(repository);
  const updateUserStatusUseCase = new UpdateUserStatusUseCase(repository);
  const getPageInfoUseCase = new GetPageInfoUseCase(repository);
  const createUserUseCase = new CreateUserUseCase(repository);

  const fetchPageInfo = useCallback(async () => {
    try {
      const info = await getPageInfoUseCase.execute();
      setPageInfo(info);
      setRoles(info.roles);
    } catch (err) {
      console.error('Failed to fetch page info:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUsersUseCase.execute(filters);
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPageInfo();
  }, [fetchPageInfo]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = async (userId: string) => {
    try {
      await deleteUserUseCase.execute(userId);
      await fetchUsers(); // Refresh list
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete user');
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'banned') => {
    try {
      await updateUserStatusUseCase.execute(userId, status);
      await fetchUsers(); // Refresh list
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update user status');
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    is_active: boolean;
    role_id: number;
    avatar?: File;
  }) => {
    try {
      await createUserUseCase.execute(userData);
      await fetchUsers(); // Refresh list
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create user');
    }
  };

  return {
    users,
    total,
    loading,
    error,
    filters,
    setFilters,
    deleteUser,
    updateUserStatus,
    createUser,
    refetch: fetchUsers,
    roles,
    pageInfo,
  };
};
