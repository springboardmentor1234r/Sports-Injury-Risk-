import { Navigate } from "react-router-dom";

function RoleDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case "admin":
            return <Navigate to="/dashboard/admin" replace />;

        case "coach":
            return <Navigate to="/dashboard/coach" replace />;

        case "athlete":
            return <Navigate to="/dashboard/athlete" replace />;

        default:
            return <Navigate to="/login" replace />;
    }
}

export default RoleDashboard;