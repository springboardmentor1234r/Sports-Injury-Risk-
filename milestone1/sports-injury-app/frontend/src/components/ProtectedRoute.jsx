// components/ProtectedRoute.jsx
// --------------------------------
// Wrap any page in this to require a logged-in user.
// Optionally pass allowedRoles=["coach","admin"] to also restrict by role.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center text-red-600">
        You don't have permission to view this page.
      </div>
    );
  }

  return children;
}
