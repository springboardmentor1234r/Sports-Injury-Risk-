import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ChevronDown,
    Menu,
    LogOut,
    User,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

import {
    useAuth,
    VIDEO_UPLOAD_ROLES,
    normalizeRole,
} from "../context/AuthContext";

export default function DashboardLayout({
    title,
    children,
}) {
    const navigate = useNavigate();

    const {
        user,
        role,
        roleLabel,
        logout,
    } = useAuth();

    const [profileOpen, setProfileOpen] =
        useState(false);

    const [mobileSidebarOpen, setMobileSidebarOpen] =
        useState(false);

    const profileRef = useRef(null);

    const currentRole = normalizeRole(
        role ||
        user?.role ||
        "athlete"
    );

    const username =
        user?.username ||
        user?.full_name ||
        "User";

    const displayRole =
        roleLabel ||
        currentRole
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );

    const canUploadVideo =
        VIDEO_UPLOAD_ROLES.includes(
            currentRole
        );

    const initial =
        username
            .charAt(0)
            .toUpperCase() || "U";

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(
                    event.target
                )
            ) {
                setProfileOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMobileSidebarOpen(false);
                setProfileOpen(false);
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow =
            mobileSidebarOpen
                ? "hidden"
                : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileSidebarOpen]);

    const handleLogout = () => {
        setProfileOpen(false);
        setMobileSidebarOpen(false);

        try {
            logout();
        } finally {
            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        }
    };

    const closeSidebar = () => {
        setMobileSidebarOpen(false);
    };

    return (
        <div className="dashboard-shell">
            <Sidebar
                mobileOpen={mobileSidebarOpen}
                onClose={closeSidebar}
                onLogout={handleLogout}
                role={currentRole}
                canUploadVideo={canUploadVideo}
            />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            type="button"
                            className="mobile-menu-button"
                            onClick={() =>
                                setMobileSidebarOpen(
                                    true
                                )
                            }
                            aria-label="Open navigation"
                        >
                            <Menu size={21} />
                        </button>

                        <div>
                            <h1 className="header-title">
                                {title}
                            </h1>

                            <p className="header-subtitle">
                                Welcome back, {username}
                            </p>
                        </div>
                    </div>

                    <div className="header-right">
                        <ThemeToggle />

                        <div
                            ref={profileRef}
                            className="profile-menu"
                        >
                            <button
                                type="button"
                                className="profile-trigger"
                                onClick={() =>
                                    setProfileOpen(
                                        (current) =>
                                            !current
                                    )
                                }
                                aria-expanded={
                                    profileOpen
                                }
                                aria-haspopup="menu"
                            >
                                <div className="user-avatar">
                                    {initial}
                                </div>

                                <div className="user-info">
                                    <span className="user-name">
                                        {username}
                                    </span>

                                    <span className="user-role">
                                        {displayRole}
                                    </span>
                                </div>

                                <ChevronDown
                                    size={16}
                                    className={
                                        `profile-chevron ${
                                            profileOpen
                                                ? "open"
                                                : ""
                                        }`
                                    }
                                />
                            </button>

                            {profileOpen && (
                                <div
                                    className="profile-dropdown"
                                    role="menu"
                                >
                                    <Link
                                        to="/profile"
                                        className="profile-dropdown-item"
                                        onClick={() =>
                                            setProfileOpen(
                                                false
                                            )
                                        }
                                    >
                                        <User size={17} />
                                        Profile
                                    </Link>

                                    <Link
                                        to="/settings"
                                        className="profile-dropdown-item"
                                        onClick={() =>
                                            setProfileOpen(
                                                false
                                            )
                                        }
                                    >
                                        Settings
                                    </Link>

                                    <button
                                        type="button"
                                        className="profile-dropdown-item danger"
                                        onClick={
                                            handleLogout
                                        }
                                    >
                                        <LogOut size={17} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <div className="dashboard-page-container">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}