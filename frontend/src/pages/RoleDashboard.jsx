import AthleteDashboard from "./AthleteDashboard";
import CoachDashboard from "./CoachDashboard";
import AdminDashboard from "./AdminDashboard";

function RoleDashboard() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        return <AthleteDashboard />;
    }

    switch (user.role) {

        case "admin":
            return <AdminDashboard />;

        case "coach":
            return <CoachDashboard />;

        default:
            return <AthleteDashboard />;

    }

}

export default RoleDashboard;