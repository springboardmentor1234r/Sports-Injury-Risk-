import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import {
    useAuth,
    normalizeRole,
} from "../context/AuthContext";

export default function ProtectedRoute({
    allowedRoles = null,
}) {
    const {
        isAuthenticated,
        loading,
        user,
    } = useAuth();

    const location =
        useLocation();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div
                        className="auth-card-heading"
                        style={{
                            textAlign: "center",
                        }}
                    >
                        <h2>
                            Loading...
                        </h2>

                        <p>
                            Restoring your session.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (
        !isAuthenticated ||
        !user
    ) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname,
                }}
            />
        );
    }

    if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0
    ) {
        const currentRole =
            normalizeRole(user.role);

        const permitted =
            allowedRoles
                .map(normalizeRole)
                .includes(currentRole);

        if (!permitted) {
            return (
                <Navigate
                    to="/dashboard"
                    replace
                />
            );
        }
    }

    return <Outlet />;
}