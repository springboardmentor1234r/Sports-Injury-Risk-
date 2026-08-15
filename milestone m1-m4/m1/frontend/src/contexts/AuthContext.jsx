import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to fetch current user profile on load if access token is cached
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data);
          localStorage.setItem('user_role', response.data.role);
        } catch (error) {
          console.error("Session restoration failed:", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_role');
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const token = response.data.access_token;
      localStorage.setItem('access_token', token);
      
      // Fetch user profile info
      const userProfileRes = await authAPI.getMe();
      setUser(userProfileRes.data);
      localStorage.setItem('user_role', userProfileRes.data.role);
      setLoading(false);
      return userProfileRes.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authAPI.register(userData);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an AuthProvider scope');
  }
  return context;
};
