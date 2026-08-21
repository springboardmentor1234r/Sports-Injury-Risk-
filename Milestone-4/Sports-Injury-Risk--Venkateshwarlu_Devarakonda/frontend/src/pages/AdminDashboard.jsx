import {
    Activity,
    AlertTriangle,
    BarChart3,
    Database,
    FileText,
    Settings,
    ShieldCheck,
    UserCog,
    Users,
    UserPlus,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

export default function AdminDashboard() {

    const username =
        localStorage.getItem("username") ||
        "Administrator";

    const [stats, setStats] = useState({
        totalUsers: 0,
        athletes: 0,
        professionals: 0,
        administrators: 0,
        totalAnalyses: 0,
        systemAlerts: 0,
    });

    const [users, setUsers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const config = {
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                },
            };

            /*
             * Backend endpoint will be implemented
             * during the backend phase.
             */

            const response =
                await api.get(
                    "/admin/dashboard",
                    config
                );

            const data =
                response.data || {};

            setStats({
                totalUsers:
                    data.total_users ?? 0,

                athletes:
                    data.total_athletes ?? 0,

                professionals:
                    data.total_professionals ?? 0,

                administrators:
                    data.total_administrators ?? 0,

                totalAnalyses:
                    data.total_analyses ?? 0,

                systemAlerts:
                    data.system_alerts ?? 0,
            });

            setUsers(
                Array.isArray(
                    data.recent_users
                )
                    ? data.recent_users
                    : []
            );

        } catch (err) {

            console.error(
                "Admin dashboard loading failed:",
                err
            );

            setStats({
                totalUsers: 0,
                athletes: 0,
                professionals: 0,
                administrators: 0,
                totalAnalyses: 0,
                systemAlerts: 0,
            });

            setUsers([]);

            /*
             * Do not break the dashboard if the
             * backend endpoint is not available yet.
             */

            setError(
                err?.response?.data?.detail ||
                ""
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <DashboardLayout
            title="Administrator Dashboard"
        >

            <div className="dashboard-page">

                {/* =====================================================
                    WELCOME
                ===================================================== */}

                <section className="dashboard-welcome">

                    <div>

                        <p className="dashboard-eyebrow">
                            System Administration
                        </p>

                        <h2 className="dashboard-welcome-title">
                            Welcome back,{" "}
                            {username} 👋
                        </h2>

                        <p className="dashboard-welcome-description">
                            Manage SportSense AI users,
                            monitor platform activity,
                            review system health and
                            control administrative settings.
                        </p>

                    </div>

                    <Link
                        to="/admin/users"
                        className="dashboard-welcome-action"
                    >

                        <UserPlus size={19} />

                        Manage Users

                    </Link>

                </section>


                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (

                    <div className="dashboard-alert warning">

                        <AlertTriangle size={18} />

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* =====================================================
                    SYSTEM STATISTICS
                ===================================================== */}

                <section
                    className="dashboard-stats-grid"
                    aria-label="Administrator statistics"
                >

                    <DashboardStatCard
                        icon={
                            <Users size={24} />
                        }
                        title="Total Users"
                        value={
                            loading
                                ? "..."
                                : stats.totalUsers
                        }
                        accent="primary"
                    />


                    <DashboardStatCard
                        icon={
                            <Activity size={24} />
                        }
                        title="Athletes"
                        value={
                            loading
                                ? "..."
                                : stats.athletes
                        }
                        accent="info"
                    />


                    <DashboardStatCard
                        icon={
                            <UserCog size={24} />
                        }
                        title="Professionals"
                        value={
                            loading
                                ? "..."
                                : stats.professionals
                        }
                        accent="success"
                    />


                    <DashboardStatCard
                        icon={
                            <ShieldCheck size={24} />
                        }
                        title="Administrators"
                        value={
                            loading
                                ? "..."
                                : stats.administrators
                        }
                        accent="primary"
                    />


                    <DashboardStatCard
                        icon={
                            <BarChart3 size={24} />
                        }
                        title="Total Analyses"
                        value={
                            loading
                                ? "..."
                                : stats.totalAnalyses
                        }
                        accent="info"
                    />


                    <DashboardStatCard
                        icon={
                            <AlertTriangle size={24} />
                        }
                        title="System Alerts"
                        value={
                            loading
                                ? "..."
                                : stats.systemAlerts
                        }
                        accent="risk"
                    />

                </section>


                {/* =====================================================
                    ADMIN ACTIONS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                Administration
                            </p>

                            <h2>
                                Platform Management
                            </h2>

                        </div>

                    </div>


                    <div className="dashboard-quick-grid">

                        <QuickAction
                            icon={
                                <Users size={22} />
                            }
                            title="User Management"
                            description="View, search and manage SportSense AI platform users."
                            to="/admin/users"
                        />


                        <QuickAction
                            icon={
                                <ShieldCheck
                                    size={22}
                                />
                            }
                            title="Roles & Permissions"
                            description="Manage role-based access for athletes and professional users."
                            to="/admin/roles"
                        />


                        <QuickAction
                            icon={
                                <Database size={22} />
                            }
                            title="System Data"
                            description="Monitor platform data, analysis records and database activity."
                            to="/admin/data"
                        />


                        <QuickAction
                            icon={
                                <Settings size={22} />
                            }
                            title="System Settings"
                            description="Configure platform-level settings and administration options."
                            to="/admin/settings"
                        />

                    </div>

                </section>


                {/* =====================================================
                    RECENT USERS
                ===================================================== */}

                <section className="dashboard-section-card">

                    <div className="dashboard-section-header">

                        <div>

                            <p className="dashboard-section-eyebrow">
                                User Activity
                            </p>

                            <h2>
                                Recent Users
                            </h2>

                        </div>

                        <Link
                            to="/admin/users"
                            className="dashboard-view-all"
                        >
                            View All
                        </Link>

                    </div>


                    <div className="dashboard-table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        User
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Joined
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <DashboardLoadingRows />

                                ) : users.length > 0 ? (

                                    users.map(
                                        (user) => (

                                            <UserRow
                                                key={
                                                    user.id
                                                }
                                                user={
                                                    user
                                                }
                                            />

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="dashboard-empty"
                                        >
                                            No recent users
                                            available yet.
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =====================================================
                    SYSTEM SECURITY
                ===================================================== */}

                <section className="dashboard-upload-card">

                    <div className="dashboard-upload-content">

                        <div className="dashboard-upload-icon">

                            <ShieldCheck
                                size={28}
                            />

                        </div>

                        <div>

                            <p className="dashboard-upload-eyebrow">
                                Platform Security
                            </p>

                            <h2>
                                Monitor access and system activity
                            </h2>

                            <p>
                                Administrators can manage users,
                                roles, permissions and platform
                                activity. Sensitive operations
                                should remain restricted to
                                authorized administrators.
                            </p>

                        </div>

                    </div>


                    <Link
                        to="/admin/users"
                        className="dashboard-upload-button"
                    >

                        <Users size={20} />

                        Manage Users

                    </Link>

                </section>

            </div>

        </DashboardLayout>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function DashboardStatCard({
    icon,
    title,
    value,
    accent = "primary",
}) {

    return (

        <article
            className={`dashboard-stat-card ${accent}`}
        >

            <div className="dashboard-stat-top">

                <div className="dashboard-stat-icon">
                    {icon}
                </div>

            </div>

            <p className="dashboard-stat-title">
                {title}
            </p>

            <h3 className="dashboard-stat-value">
                {value}
            </h3>

        </article>
    );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
    icon,
    title,
    description,
    to,
}) {

    return (

        <Link
            to={to}
            className="dashboard-quick-card"
        >

            <div className="dashboard-quick-icon">
                {icon}
            </div>

            <div>

                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>

            </div>

        </Link>
    );
}


/* =========================================================
   USER ROW
========================================================= */

function UserRow({
    user,
}) {

    const name =
        user.username ||
        user.name ||
        "User";

    const email =
        user.email ||
        "--";

    const role =
        user.role ||
        "athlete";

    const status =
        user.status ||
        "Active";

    const joined =
        user.created_at ||
        user.joined_at;

    const formattedDate = joined
        ? new Date(joined).toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        )
        : "--";

    return (

        <tr className="dashboard-table-row">

            <td>

                <div className="dashboard-video-name">

                    <div className="dashboard-video-icon">
                        <Users size={18} />
                    </div>

                    <span>
                        {name}
                    </span>

                </div>

            </td>


            <td>
                {email}
            </td>


            <td>

                <span className="dashboard-role-badge">
                    {formatRole(role)}
                </span>

            </td>


            <td>

                <span className="dashboard-status success">

                    <span className="dashboard-status-dot" />

                    {status}

                </span>

            </td>


            <td>
                {formattedDate}
            </td>

        </tr>
    );
}


/* =========================================================
   ROLE FORMATTER
========================================================= */

function formatRole(role) {

    const roleMap = {
        athlete: "Athlete",
        coach: "Coach",
        physiotherapist: "Physiotherapist",
        sports_scientist: "Sports Scientist",
        admin: "Administrator",
        administrator: "Administrator",
    };

    return (
        roleMap[role] ||
        role
    );
}


/* =========================================================
   LOADING ROWS
========================================================= */

function DashboardLoadingRows() {

    return (
        <>
            {[1, 2, 3].map(
                (item) => (

                    <tr
                        key={item}
                        className="dashboard-table-row"
                    >

                        <td>
                            <div className="dashboard-table-skeleton short" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton short" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton status" />
                        </td>

                        <td>
                            <div className="dashboard-table-skeleton medium" />
                        </td>

                    </tr>

                )
            )}
        </>
    );
}