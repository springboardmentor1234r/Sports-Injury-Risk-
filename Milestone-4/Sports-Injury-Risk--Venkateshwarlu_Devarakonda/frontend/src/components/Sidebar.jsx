import {
    Activity,
    BarChart3,
    ClipboardCheck,
    FileBarChart,
    History,
    Home,
    LogOut,
    Settings,
    Upload,
    User,
    Users,
} from "lucide-react";

import {
    Link,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const commonNavigation = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: Home,
    },
    {
        label: "Analysis",
        path: "/analysis",
        icon: Activity,
    },
    {
        label: "Reports",
        path: "/reports",
        icon: FileBarChart,
    },
];

const roleNavigation = {
    athlete: [
        {
            label: "Upload Video",
            path: "/upload",
            icon: Upload,
        },
        {
            label: "Upload History",
            path: "/history",
            icon: History,
        },
    ],

    coach: [
        {
            label: "Athletes",
            path: "/athletes",
            icon: Users,
        },
        {
            label: "Upload Video",
            path: "/upload",
            icon: Upload,
        },
        {
            label: "Upload History",
            path: "/history",
            icon: History,
        },
    ],

    physiotherapist: [
        {
            label: "Athletes",
            path: "/athletes",
            icon: Users,
        },
        {
            label: "Movement Analysis",
            path: "/analysis",
            icon: Activity,
        },
        {
            label: "Rehabilitation Reports",
            path: "/reports",
            icon: ClipboardCheck,
        },
    ],

    sports_scientist: [
        {
            label: "Athletes",
            path: "/athletes",
            icon: Users,
        },
        {
            label: "Movement Analysis",
            path: "/analysis",
            icon: BarChart3,
        },
        {
            label: "Research Reports",
            path: "/reports",
            icon: FileBarChart,
        },
    ],

    admin: [
        {
            label: "Users",
            path: "/athletes",
            icon: Users,
        },
        {
            label: "System Analysis",
            path: "/analysis",
            icon: BarChart3,
        },
    ],
};

const accountNavigation = [
    {
        label: "Profile",
        path: "/profile",
        icon: User,
    },
    {
        label: "Settings",
        path: "/settings",
        icon: Settings,
    },
];

export default function Sidebar({
    mobileOpen = false,
    onClose = () => {},
}) {
    const location = useLocation();

    const {
        user,
        role,
        roleLabel,
        logout,
    } = useAuth();

    const username =
        user?.username ||
        "User";

    const initial =
        username
            .charAt(0)
            .toUpperCase();

    const navigation = [
        ...commonNavigation,
        ...(roleNavigation[role] || []),
    ];

    const uniqueNavigation =
        navigation.filter(
            (item, index, array) =>
                array.findIndex(
                    (entry) =>
                        entry.path === item.path
                ) === index
        );

    const isActive = (path) => {
        if (path === "/dashboard") {
            return location.pathname === "/dashboard";
        }

        return (
            location.pathname === path ||
            location.pathname.startsWith(
                `${path}/`
            )
        );
    };

    const handleLogout = () => {
        onClose();
        logout();
    };

    const renderLink = (item) => {
        const Icon = item.icon;

        return (
            <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={
                    `sidebar-link ${
                        isActive(item.path)
                            ? "active"
                            : ""
                    }`
                }
            >
                <Icon
                    size={19}
                    strokeWidth={1.9}
                />

                <span>
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <>
            {mobileOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    aria-label="Close navigation"
                    onClick={onClose}
                />
            )}

            <aside
                className={
                    `sidebar ${
                        mobileOpen
                            ? "sidebar-mobile-open"
                            : ""
                    }`
                }
            >
                <div className="sidebar-brand">
                    <Link
                        to="/dashboard"
                        className="sidebar-brand-link"
                        onClick={onClose}
                    >
                        <div className="sidebar-brand-icon">
                            <Activity
                                size={20}
                                strokeWidth={2}
                            />
                        </div>

                        <div>
                            <div className="sidebar-logo">
                                SportSense <span>AI</span>
                            </div>

                            <div className="sidebar-description">
                                Sports Injury Intelligence
                            </div>
                        </div>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">
                        Workspace
                    </div>

                    {uniqueNavigation.map(
                        renderLink
                    )}

                    <div className="sidebar-section-label sidebar-section-spaced">
                        Account
                    </div>

                    {accountNavigation.map(
                        renderLink
                    )}
                </nav>

                <div className="sidebar-footer">
                    <Link
                        to="/profile"
                        className="sidebar-user-card"
                        onClick={onClose}
                    >
                        <div className="sidebar-user-avatar">
                            {initial}
                        </div>

                        <div className="sidebar-user-info">
                            <strong>
                                {username}
                            </strong>

                            <span>
                                {roleLabel}
                            </span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}