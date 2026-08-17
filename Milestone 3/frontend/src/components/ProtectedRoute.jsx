import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user }) => {
  const token = localStorage.getItem('athletiq_token');
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
