// components/ProtectedRoute.jsx
// --------------------------------
// Wrap any page in this to require a logged-in user.
// Optionally pass allowedRoles=["coach","admin"] to also restrict by role.
// Also wraps the page in the sidebar app shell, since every authenticated
// page shares that layout.

import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AppShell from "./AppShell";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center text-center py-24">
          <ShieldAlert className="text-coral mb-4" size={32} strokeWidth={1.5} />
          <h2 className="font-display font-semibold text-paper mb-1.5">Access restricted</h2>
          <p className="text-sm text-muted max-w-sm">
            Your role ({user.role.replace("_", " ")}) doesn't have permission to view this page.
          </p>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
