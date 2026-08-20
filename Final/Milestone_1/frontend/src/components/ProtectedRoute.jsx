import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Route guard component that checks for the presence of a JWT token.
 * If no token is found, it redirects the user to the login screen.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
