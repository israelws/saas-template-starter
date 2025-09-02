import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function useAuth() {
  const auth = useSelector((state: RootState) => state.auth);
  
  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
  };
}