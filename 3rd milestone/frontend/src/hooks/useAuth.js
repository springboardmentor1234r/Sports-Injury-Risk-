import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import authService from '../services/authService';

/**
 * Custom hook for authentication state and actions.
 */
export default function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    return response.data;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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
    token,
    isAuthenticated: !!token || isAuthenticated,
    loading,
    login,
    register,
    logout: handleLogout,
    hasRole,
    hasAnyRole,
  };
}
