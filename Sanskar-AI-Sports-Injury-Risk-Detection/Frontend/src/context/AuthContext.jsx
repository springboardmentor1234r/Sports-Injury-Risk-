import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/me');
          const userData = response.data?.data || response.data;
          setUser({ id: userData._id, name: userData.name, email: userData.email, role: userData.role });
        } catch (err) {
          console.error('[AuthContext] Restore user session failed:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem('token');
      if (!token && user) {
        setUser(null);
      }
    }
  }, [loading, user]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const userData = response.data?.data || response.data;
      const normalizedUser = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };
      localStorage.setItem('token', userData.token);
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      throw new Error(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
