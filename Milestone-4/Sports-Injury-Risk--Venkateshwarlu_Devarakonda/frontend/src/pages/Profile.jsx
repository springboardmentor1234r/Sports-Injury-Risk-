import {
    useEffect,
    useState,
} from "react";

import {
    Edit,
    History,
    Upload,
    User,
    Activity,
    ShieldCheck,
    Target,
    Mail,
    Briefcase,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import api from "../services/api";

import DashboardLayout
    from "../components/DashboardLayout";

import {
    useAuth,
    normalizeRole,
    getRoleLabel,
} from "../context/AuthContext";

export default function Profile() {
    const {
        user: authUser,
        role: authRole,
        refreshUser,
    } = useAuth();

    const [user, setUser] =
        useState(authUser);

    const [profile, setProfile] =
        useState(null);

    const [stats, setStats] =
        useState({
            total_uploads: 0,
            total_analysis: 0,
            current_risk: "-",
            accuracy: "-",
        });

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const token =
            localStorage.getItem(
                "token"
            );

        if (!token) {
            setLoading(false);
            return;
        }

        const headers = {
            Authorization:
                `Bearer ${token}`,
        };

        try {
            let currentUser = {
                ...(authUser || {}),
            };

            try {
                const response =
                    await api.get(
                        "/auth/me",
                        { headers }
                    );

                const data =
                    response?.data || {};

                const backendUser =
                    data.user ||
                    data ||
                    {};

                currentUser = {
                    ...currentUser,
                    ...backendUser,
                    username:
                        backendUser.username ||
                        backendUser.full_name ||
                        currentUser.username ||
                        "User",
                    email:
                        backendUser.email ||
                        currentUser.email ||
                        "",
                    role: normalizeRole(
                        backendUser.role ||
                        authRole
                    ),
                };
            } catch (error) {
                console.warn(
                    "Unable to load auth user:",
                    error
                );

                currentUser.role =
                    normalizeRole(
                        authRole
                    );
            }

            const currentRole =
                normalizeRole(
                    currentUser.role
                );

            if (!currentRole) {
                throw new Error(
                    "Authenticated user role is missing."
                );
            }

            currentUser.role =
                currentRole;

            setUser(currentUser);

            if (
                currentRole !==
                "athlete"
            ) {
                setProfile(null);
                setStats({
                    total_uploads: 0,
                    total_analysis: 0,
                    current_risk: "-",
                    accuracy: "-",
                });

                if (refreshUser) {
                    await refreshUser();
                }

                return;
            }

            const requests = [
                api.get(
                    "/video/dashboard",
                    { headers }
                ),
                api.get(
                    "/athlete/profile",
                    { headers }
                ),
            ];

            const results =
                await Promise.allSettled(
                    requests
                );

            const dashboardResult =
                results[0];

            if (
                dashboardResult.status ===
                "fulfilled"
            ) {
                const data =
                    dashboardResult
                        .value
                        ?.data || {};

                setStats({
                    total_uploads:
                        data.total_uploads ??
                        data.videos_uploaded ??
                        0,

                    total_analysis:
                        data.total_analysis ??
                        data.ai_analyses ??
                        0,

                    current_risk:
                        data.current_risk ??
                        data.risk_level ??
                        "-",

                    accuracy:
                        data.accuracy ??
                        data.pose_success_rate ??
                        "-",
                });
            }

            const profileResult =
                results[1];

            if (
                profileResult.status ===
                "fulfilled"
            ) {
                const data =
                    profileResult
                        ?.value
                        ?.data || {};

                setProfile(data);

                try {
                    localStorage.setItem(
                        "athleteProfile",
                        JSON.stringify(
                            data
                        )
                    );
                } catch (error) {
                    console.warn(
                        "Unable to cache profile:",
                        error
                    );
                }
            } else {
                loadCachedProfile();
            }

            if (refreshUser) {
                await refreshUser();
            }
        } catch (error) {
            console.error(
                "PROFILE LOAD ERROR:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    function loadCachedProfile() {
        try {
            const cached =
                localStorage.getItem(
                    "athleteProfile"
                );

            if (cached) {
                setProfile(
                    JSON.parse(
                        cached
                    )
                );
            }
        } catch (error) {
            console.warn(
                "PROFILE CACHE ERROR:",
                error
            );
        }
    }

    if (loading) {
        return (
            <DashboardLayout
                title="Profile"
            >
                <div className="sp-loading">
                    <div className="sp-loading-spinner" />

                    <p>
                        Loading your profile...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    const username =
        user?.username ||
        "User";

    const email =
        user?.email ||
        "";

    const role =
        normalizeRole(
            user?.role ||
            authRole
        );

    const roleLabel =
        getRoleLabel(role);

    const initial =
        username
            .charAt(0)
            .toUpperCase() || "U";

    const isAthlete =
        role === "athlete";

    function displayValue(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        return value;
    }

    function displayNumberWithUnit(
        value,
        unit
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        return `${value} ${unit}`;
    }

    return (
        <DashboardLayout
            title="Profile"
        >
            <div className="sp-profile-page">
                {isAthlete && (
                    <div className="sp-profile-actions">
                        <Link
                            to="/upload"
                            className="sp-btn sp-btn-primary"
                        >
                            <Upload size={17} />
                            Upload Video
                        </Link>

                        <Link
                            to="/history"
                            className="sp-btn sp-btn-secondary"
                        >
                            <History size={17} />
                            History
                        </Link>
                    </div>
                )}

                <section className="sp-profile-hero">
                    <div className="sp-profile-avatar">
                        {initial}
                    </div>

                    <div className="sp-profile-hero-info">
                        <div className="sp-profile-name-row">
                            <h1>
                                {username}
                            </h1>

                            <span className="sp-profile-role">
                                {roleLabel}
                            </span>
                        </div>

                        <p>
                            Manage your SportSense AI
                            account information and
                            professional profile.
                        </p>
                    </div>

                    {isAthlete && (
                        <Link
                            to="/profile/edit"
                            className="sp-btn sp-btn-primary sp-edit-profile-btn"
                        >
                            <Edit size={17} />
                            Edit Profile
                        </Link>
                    )}
                </section>

                <section className="sp-card">
                    <div className="sp-section-header">
                        <div className="sp-section-icon purple">
                            <User size={19} />
                        </div>

                        <div>
                            <h2>
                                Account Information
                            </h2>

                            <p>
                                Your SportSense AI
                                account details.
                            </p>
                        </div>
                    </div>

                    <div className="sp-info-grid">
                        <ProfileValue
                            label="Username"
                            value={username}
                        />

                        <ProfileValue
                            label="Email"
                            value={email}
                        />

                        <ProfileValue
                            label="Role"
                            value={roleLabel}
                        />

                        <ProfileValue
                            label="Account Status"
                            value="Active"
                        />
                    </div>
                </section>

                {isAthlete && (
                    <>
                        <section className="sp-card">
                            <div className="sp-section-header">
                                <div className="sp-section-icon blue">
                                    <Activity size={19} />
                                </div>

                                <div>
                                    <h2>
                                        Athlete Information
                                    </h2>

                                    <p>
                                        Your personal and
                                        sports information.
                                    </p>
                                </div>
                            </div>

                            <div className="sp-info-grid">
                                <ProfileValue
                                    label="Full Name"
                                    value={
                                        profile?.full_name ||
                                        profile?.name ||
                                        username
                                    }
                                />

                                <ProfileValue
                                    label="Age"
                                    value={
                                        profile?.age
                                    }
                                />

                                <ProfileValue
                                    label="Gender"
                                    value={
                                        profile?.gender
                                    }
                                />

                                <ProfileValue
                                    label="Height"
                                    value={displayNumberWithUnit(
                                        profile?.height,
                                        "cm"
                                    )}
                                />

                                <ProfileValue
                                    label="Weight"
                                    value={displayNumberWithUnit(
                                        profile?.weight,
                                        "kg"
                                    )}
                                />

                                <ProfileValue
                                    label="Sport"
                                    value={
                                        profile?.sport
                                    }
                                />

                                <ProfileValue
                                    label="Playing Position"
                                    value={
                                        profile?.position
                                    }
                                />

                                <ProfileValue
                                    label="Experience"
                                    value={
                                        profile?.experience_years !==
                                            undefined &&
                                        profile?.experience_years !==
                                            null &&
                                        profile?.experience_years !==
                                            ""
                                            ? `${profile.experience_years} years`
                                            : "-"
                                    }
                                />

                                <ProfileValue
                                    label="Dominant Leg"
                                    value={
                                        profile?.dominant_leg
                                    }
                                />
                            </div>
                        </section>

                        <section className="sp-card">
                            <div className="sp-section-header">
                                <div className="sp-section-icon blue">
                                    <Target size={19} />
                                </div>

                                <div>
                                    <h2>
                                        Training Information
                                    </h2>

                                    <p>
                                        Information used for
                                        personalized analysis.
                                    </p>
                                </div>
                            </div>

                            <div className="sp-training-content">
                                <div className="sp-large-info">
                                    <span>
                                        Training Goals
                                    </span>

                                    <strong>
                                        {displayValue(
                                            profile?.training_goals
                                        )}
                                    </strong>
                                </div>

                                <div className="sp-large-info">
                                    <span>
                                        Injury History
                                    </span>

                                    <strong>
                                        {displayValue(
                                            profile?.injury_history
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </section>

                        <section className="sp-statistics-section">
                            <div className="sp-section-header">
                                <div className="sp-section-icon green">
                                    <Target size={19} />
                                </div>

                                <div>
                                    <h2>
                                        Athlete Statistics
                                    </h2>

                                    <p>
                                        Current statistics from
                                        the analysis system.
                                    </p>
                                </div>
                            </div>

                            <div className="sp-stat-grid">
                                <StatCard
                                    icon={
                                        <Upload size={19} />
                                    }
                                    title="Videos Uploaded"
                                    value={
                                        stats.total_uploads
                                    }
                                    description="Total videos submitted"
                                />

                                <StatCard
                                    icon={
                                        <Activity size={19} />
                                    }
                                    title="AI Analyses"
                                    value={
                                        stats.total_analysis
                                    }
                                    description="Completed analyses"
                                />

                                <StatCard
                                    icon={
                                        <ShieldCheck size={19} />
                                    }
                                    title="Current Risk"
                                    value={
                                        stats.current_risk
                                    }
                                    description="Latest detected risk"
                                />

                                <StatCard
                                    icon={
                                        <Target size={19} />
                                    }
                                    title="System Accuracy"
                                    value={
                                        stats.accuracy
                                    }
                                    description="Latest analysis accuracy"
                                />
                            </div>
                        </section>
                    </>
                )}

                {!isAthlete && (
                    <section className="sp-card">
                        <div className="sp-section-header">
                            <div className="sp-section-icon blue">
                                <Briefcase size={19} />
                            </div>

                            <div>
                                <h2>
                                    Professional Information
                                </h2>

                                <p>
                                    Your role within the
                                    SportSense AI platform.
                                </p>
                            </div>
                        </div>

                        <div className="sp-info-grid">
                            <ProfileValue
                                label="Platform Role"
                                value={roleLabel}
                            />

                            <ProfileValue
                                label="Email"
                                value={email}
                            />

                            <ProfileValue
                                label="Account Status"
                                value="Active"
                            />
                        </div>
                    </section>
                )}

                {email && (
                    <section className="sp-card">
                        <div className="sp-section-header">
                            <div className="sp-section-icon purple">
                                <Mail size={19} />
                            </div>

                            <div>
                                <h2>
                                    Account Contact
                                </h2>

                                <p>
                                    Email associated with
                                    this SportSense account.
                                </p>
                            </div>
                        </div>

                        <div className="sp-profile-value">
                            <span>
                                Email Address
                            </span>

                            <strong>
                                {email}
                            </strong>
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}

function ProfileValue({
    label,
    value,
}) {
    return (
        <div className="sp-profile-value">
            <span>
                {label}
            </span>

            <strong>
                {
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                        ? value
                        : "-"
                }
            </strong>
        </div>
    );
}

function StatCard({
    icon,
    title,
    value,
    description,
}) {
    return (
        <div className="sp-stat-card">
            <div className="sp-stat-icon">
                {icon}
            </div>

            <div className="sp-stat-content">
                <span className="sp-stat-title">
                    {title}
                </span>

                <strong className="sp-stat-value">
                    {value ?? "-"}
                </strong>

                <span className="sp-stat-description">
                    {description}
                </span>
            </div>
        </div>
    );
}