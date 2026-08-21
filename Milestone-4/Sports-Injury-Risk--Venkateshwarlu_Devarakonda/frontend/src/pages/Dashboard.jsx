import {
    Navigate,
} from "react-router-dom";

import {
    useAuth,
    normalizeRole,
} from "../context/AuthContext";

import AthleteDashboard
    from "./AthleteDashboard";

import CoachDashboard
    from "./CoachDashboard";

import PhysiotherapistDashboard
    from "./PhysiotherapistDashboard";

import SportsScientistDashboard
    from "./SportsScientistDashboard";

import AdminDashboard
    from "./AdminDashboard";

export default function Dashboard() {
    const {
        role,
        loading,
    } = useAuth();

    if (loading) {
        return (
            <div className="sp-loading">
                <div className="sp-loading-spinner" />

                <p>
                    Loading dashboard...
                </p>
            </div>
        );
    }

    const currentRole =
        normalizeRole(role);

    switch (currentRole) {
        case "athlete":
            return <AthleteDashboard />;

        case "coach":
            return <CoachDashboard />;

        case "physiotherapist":
            return (
                <PhysiotherapistDashboard />
            );

        case "sports_scientist":
            return (
                <SportsScientistDashboard />
            );

        case "admin":
            return <AdminDashboard />;

        default:
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
    }
}