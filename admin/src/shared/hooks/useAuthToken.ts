import { useContext } from 'react';
import { AuthContext } from '../../features/auth/hooks/useAuth';

/**
 * Hook to get access token from Auth context
 * Must be used inside AuthProvider
 */
export const useAuthToken = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthToken must be used inside AuthProvider');
  }
  return context.token;
};
