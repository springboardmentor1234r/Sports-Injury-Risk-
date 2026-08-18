import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, loginSuccess } from '../store/slices/authSlice';
import authService from '../services/authService';

/**
 * Custom hook for authentication state and actions.
 */
export default function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const user = response.user || response;
    localStorage.setItem('user', JSON.stringify(user));
    dispatch(loginSuccess(user));
    return user;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    return response.data;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // ignore errors
    }
    localStorage.removeItem('user');
    dispatch(logout());
    navigate('/login');
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (...roles) => {
    return roles.includes(user?.role);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout: handleLogout,
    hasRole,
    hasAnyRole,
  };
}
