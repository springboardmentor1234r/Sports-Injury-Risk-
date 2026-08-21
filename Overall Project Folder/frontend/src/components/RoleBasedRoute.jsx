import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleBasedRoute = ({ children, allowedRoles, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  if (!allowed.includes(userRole) && userRole !== 'admin') {
    // Redirect user to their appropriate default dashboard
    const defaultPath =
      userRole === 'athlete'
        ? '/athlete/dashboard'
        : userRole === 'coach'
        ? '/coach/dashboard'
        : userRole === 'physiotherapist'
        ? '/physiotherapist/dashboard'
        : userRole === 'scientist'
        ? '/scientist/dashboard'
        : '/admin/dashboard';

    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
