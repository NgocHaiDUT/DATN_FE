/**
 * Get refresh token from localStorage (for internal use only)
 * authApi stores it with key '__rt'
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem('__rt');
  } catch {
    return null;
  }
};

/**
 * Access token is stored in React Context memory only (from useAuth hook)
 * This function returns empty headers - UserApi must use useAuth hook instead
 * @deprecated - Use useAuth hook to get token from context
 */
export const getAuthHeader = (): Record<string, string> => {
  // Access token only in memory - cannot access here
  // Return empty, real implementation in UserApi must use useAuth
  return {};
};
