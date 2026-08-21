import {
    ArrowLeft,
    Bell,
    Check,
    ChevronRight,
    Eye,
    EyeOff,
    Info,
    Loader2,
    Lock,
    LogOut,
    Moon,
    Save,
    Shield,
    Sun,
    Trash2,
    User,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import ThemeToggle from "../components/ThemeToggle";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const NOTIFICATION_STORAGE_KEY =
    "sportsense-notification-settings";

const PROFILE_STORAGE_KEYS = [
    "athleteProfile",
    "coachProfile",
    "physiotherapistProfile",
    "sportsScientistProfile",
];

const DEFAULT_NOTIFICATIONS = {
    riskAlerts: true,
    trainingReminders: true,
    assessmentAlerts: true,
    emailNotifications: false,
};

export default function Settings() {
    const navigate = useNavigate();

    const {
        user,
        role,
        logout: authLogout,
    } = useAuth();

    const {
        theme,
        isDark,
        isLight,
        setTheme,
    } = useTheme();

    const [username, setUsername] = useState(
        user?.username ||
        user?.full_name ||
        localStorage.getItem("username") ||
        "User"
    );

    const [
        notifications,
        setNotifications,
    ] = useState(DEFAULT_NOTIFICATIONS);

    const [
        notificationSaved,
        setNotificationSaved,
    ] = useState(false);

    const [
        passwordOpen,
        setPasswordOpen,
    ] = useState(false);

    const [
        passwordLoading,
        setPasswordLoading,
    ] = useState(false);

    const [
        passwordSuccess,
        setPasswordSuccess,
    ] = useState("");

    const [
        passwordError,
        setPasswordError,
    ] = useState("");

    const [
        showCurrentPassword,
        setShowCurrentPassword,
    ] = useState(false);

    const [
        showNewPassword,
        setShowNewPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        passwordForm,
        setPasswordForm,
    ] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [
        deleteLoading,
        setDeleteLoading,
    ] = useState(false);

    const [
        pageMessage,
        setPageMessage,
    ] = useState("");

    const normalizedRole =
        String(role || "athlete")
            .trim()
            .toLowerCase();

    const profilePath =
        normalizedRole === "coach"
            ? "/profile/edit"
            : normalizedRole === "physiotherapist"
                ? "/profile/edit"
                : normalizedRole === "sports_scientist"
                    ? "/profile/edit"
                    : "/profile/edit";

    const profileTitle =
        normalizedRole === "coach"
            ? "Edit Coach Profile"
            : normalizedRole === "physiotherapist"
                ? "Edit Physiotherapist Profile"
                : normalizedRole === "sports_scientist"
                    ? "Edit Sports Scientist Profile"
                    : "Edit Athlete Profile";

    const profileDescription =
        normalizedRole === "coach"
            ? "Update your coaching information and professional details."
            : normalizedRole === "physiotherapist"
                ? "Update your physiotherapy information and professional details."
                : normalizedRole === "sports_scientist"
                    ? "Update your sports science information and professional details."
                    : "Update your age, sport, position and athlete information.";

    useEffect(() => {
        try {
            const storedNotifications =
                localStorage.getItem(
                    NOTIFICATION_STORAGE_KEY
                );

            if (storedNotifications) {
                const parsed =
                    JSON.parse(storedNotifications);

                if (
                    parsed &&
                    typeof parsed === "object"
                ) {
                    setNotifications({
                        ...DEFAULT_NOTIFICATIONS,
                        ...parsed,
                    });
                }
            }
        } catch (error) {
            console.warn(
                "Unable to load notification settings:",
                error
            );
        }
    }, []);

    useEffect(() => {
        const syncProfile = () => {
            const contextUsername =
                user?.username ||
                user?.full_name;

            if (contextUsername) {
                setUsername(contextUsername);
                return;
            }

            const storedUsername =
                localStorage.getItem("username");

            if (storedUsername) {
                setUsername(storedUsername);
                return;
            }

            for (
                const storageKey of PROFILE_STORAGE_KEYS
            ) {
                try {
                    const storedProfile =
                        localStorage.getItem(
                            storageKey
                        );

                    if (!storedProfile) {
                        continue;
                    }

                    const profile =
                        JSON.parse(storedProfile);

                    const profileName =
                        profile?.full_name ||
                        profile?.name;

                    if (profileName) {
                        setUsername(profileName);
                        return;
                    }
                } catch {
                    continue;
                }
            }
        };

        syncProfile();
    }, [user]);

    const handleLogout = () => {
        authLogout();

        navigate("/login", {
            replace: true,
        });
    };

    const deleteAccount = async () => {
        const confirmed =
            window.confirm(
                "Delete your SportSense AI account?\n\n" +
                "Your account, profile, uploaded videos and reports may be permanently deleted.\n\n" +
                "This action cannot be undone."
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(true);
            setPageMessage("");

            await api.delete(
                "/auth/delete-account"
            );

            authLogout();

            window.alert(
                "Your account has been deleted successfully."
            );

            navigate("/login", {
                replace: true,
            });
        } catch (error) {
            console.error(
                "DELETE ACCOUNT ERROR:",
                error
            );

            if (
                error?.response?.status === 401
            ) {
                authLogout();

                navigate("/login", {
                    replace: true,
                });

                return;
            }

            window.alert(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to delete the account. Please try again."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const updateNotification = (key) => {
        setNotifications((current) => ({
            ...current,
            [key]: !current[key],
        }));

        setNotificationSaved(false);
        setPageMessage("");
    };

    const saveNotificationSettings = () => {
        try {
            localStorage.setItem(
                NOTIFICATION_STORAGE_KEY,
                JSON.stringify(notifications)
            );

            setNotificationSaved(true);
            setPageMessage(
                "Notification preferences saved."
            );

            window.setTimeout(() => {
                setNotificationSaved(false);
            }, 2500);
        } catch (error) {
            console.error(
                "Notification save error:",
                error
            );

            setPageMessage(
                "Unable to save notification preferences."
            );
        }
    };

    const openPasswordModal = () => {
        setPasswordError("");
        setPasswordSuccess("");

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        setPasswordOpen(true);
    };

    const closePasswordModal = () => {
        if (passwordLoading) {
            return;
        }

        setPasswordOpen(false);
        setPasswordError("");
        setPasswordSuccess("");

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const updatePasswordField = (
        field,
        value
    ) => {
        setPasswordForm((current) => ({
            ...current,
            [field]: value,
        }));

        setPasswordError("");
        setPasswordSuccess("");
    };

    const changePassword = async (event) => {
        event.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        const {
            currentPassword,
            newPassword,
            confirmPassword,
        } = passwordForm;

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setPasswordError(
                "Please complete all password fields."
            );
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "New password must contain at least 8 characters."
            );
            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            setPasswordError(
                "New password and confirmation do not match."
            );
            return;
        }

        if (
            currentPassword ===
            newPassword
        ) {
            setPasswordError(
                "New password must be different from your current password."
            );
            return;
        }

        try {
            setPasswordLoading(true);

            await api.post(
                "/auth/change-password",
                {
                    current_password:
                        currentPassword,
                    new_password:
                        newPassword,
                }
            );

            setPasswordSuccess(
                "Password changed successfully."
            );

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            window.setTimeout(() => {
                setPasswordOpen(false);
                setPasswordSuccess("");
            }, 1500);
        } catch (error) {
            console.error(
                "CHANGE PASSWORD ERROR:",
                error
            );

            if (
                error?.response?.status === 401
            ) {
                setPasswordError(
                    "Current password is incorrect or your session has expired."
                );
            } else {
                setPasswordError(
                    error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Unable to change password. Please try again."
                );
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleThemeChange = (
        selectedTheme
    ) => {
        setTheme(selectedTheme);

        setPageMessage(
            `${selectedTheme === "dark" ? "Dark" : "Light"} mode enabled.`
        );

        window.setTimeout(() => {
            setPageMessage("");
        }, 1800);
    };

    return (
        <DashboardLayout title="Settings">
            <main className="settings-page">
                <section className="settings-hero">
                    <div className="settings-hero-left">
                        <div className="settings-hero-icon">
                            <User size={24} />
                        </div>

                        <div>
                            <span className="settings-hero-kicker">
                                ACCOUNT CONTROL CENTER
                            </span>

                            <h1>Settings</h1>

                            <p>
                                Manage your profile, security,
                                appearance and notification
                                preferences.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/dashboard"
                        className="settings-back-button"
                    >
                        <ArrowLeft size={17} />
                        Dashboard
                    </Link>
                </section>

                {pageMessage && (
                    <div className="settings-page-message">
                        <Check size={17} />
                        {pageMessage}
                    </div>
                )}

                <div className="settings-stack">
                    <section className="settings-card">
                        <SettingsHeader
                            icon={<User size={20} />}
                            title="Account"
                            description="Your current SportSense AI account information."
                        />

                        <div className="settings-account-grid">
                            <AccountItem
                                label="Username"
                                value={username}
                            />

                            <AccountItem
                                label="Account Role"
                                value={
                                    role ||
                                    "athlete"
                                }
                                capitalize
                            />

                            <AccountItem
                                label="Email"
                                value={
                                    user?.email ||
                                    localStorage.getItem(
                                        "email"
                                    ) ||
                                    "Not available"
                                }
                            />
                        </div>
                    </section>

                    <Link
                        to={profilePath}
                        className="settings-navigation-card"
                    >
                        <div className="settings-navigation-main">
                            <div className="settings-navigation-icon profile">
                                <User size={20} />
                            </div>

                            <div>
                                <h3>
                                    {profileTitle}
                                </h3>

                                <p>
                                    {profileDescription}
                                </p>
                            </div>
                        </div>

                        <ChevronRight
                            size={21}
                            className="settings-arrow"
                        />
                    </Link>

                    <section className="settings-card settings-card-clickable">
                        <button
                            type="button"
                            className="settings-navigation-button"
                            onClick={
                                openPasswordModal
                            }
                        >
                            <div className="settings-navigation-main">
                                <div className="settings-navigation-icon security">
                                    <Lock size={20} />
                                </div>

                                <div>
                                    <h3>
                                        Change Password
                                    </h3>

                                    <p>
                                        Update your account
                                        password and keep your
                                        account secure.
                                    </p>
                                </div>
                            </div>

                            <ChevronRight
                                size={21}
                                className="settings-arrow"
                            />
                        </button>
                    </section>

                    <section className="settings-card">
                        <SettingsHeader
                            icon={<Moon size={20} />}
                            title="Appearance"
                            description="Choose the interface theme that works best for you."
                        />

                        <div className="theme-choice-grid">
                            <ThemeChoice
                                icon={<Sun size={20} />}
                                title="Light Mode"
                                description="Bright, clean and professional."
                                selected={isLight}
                                onClick={() =>
                                    handleThemeChange(
                                        "light"
                                    )
                                }
                            />

                            <ThemeChoice
                                icon={<Moon size={20} />}
                                title="Dark Mode"
                                description="Focused, low-glare interface."
                                selected={isDark}
                                onClick={() =>
                                    handleThemeChange(
                                        "dark"
                                    )
                                }
                            />
                        </div>

                        <div className="settings-current-theme">
                            <div>
                                <span>
                                    Current theme
                                </span>

                                <strong>
                                    {theme}
                                </strong>
                            </div>

                            <ThemeToggle />
                        </div>
                    </section>

                    <section className="settings-card">
                        <SettingsHeader
                            icon={<Bell size={20} />}
                            title="Notifications"
                            description="Control the alerts and reminders shown by SportSense AI."
                        />

                        <div className="notification-settings">
                            <NotificationRow
                                title="High-risk movement alerts"
                                description="Notify you when an assessment detects elevated injury-risk indicators."
                                enabled={
                                    notifications.riskAlerts
                                }
                                onChange={() =>
                                    updateNotification(
                                        "riskAlerts"
                                    )
                                }
                            />

                            <NotificationRow
                                title="Training reminders"
                                description="Receive reminders to review movement quality and recommendations."
                                enabled={
                                    notifications.trainingReminders
                                }
                                onChange={() =>
                                    updateNotification(
                                        "trainingReminders"
                                    )
                                }
                            />

                            <NotificationRow
                                title="Assessment completion"
                                description="Notify you when a video analysis has finished processing."
                                enabled={
                                    notifications.assessmentAlerts
                                }
                                onChange={() =>
                                    updateNotification(
                                        "assessmentAlerts"
                                    )
                                }
                            />

                            <NotificationRow
                                title="Email notifications"
                                description="Allow future SportSense AI email notifications."
                                enabled={
                                    notifications.emailNotifications
                                }
                                onChange={() =>
                                    updateNotification(
                                        "emailNotifications"
                                    )
                                }
                            />
                        </div>

                        <div className="notification-footer">
                            {notificationSaved && (
                                <span className="settings-success-inline">
                                    <Check size={16} />
                                    Saved
                                </span>
                            )}

                            <button
                                type="button"
                                className="settings-primary-button"
                                onClick={
                                    saveNotificationSettings
                                }
                            >
                                <Save size={17} />
                                Save Preferences
                            </button>
                        </div>
                    </section>

                    <section className="settings-card">
                        <SettingsHeader
                            icon={<Shield size={20} />}
                            title="Security"
                            description="Information about how your current session is protected."
                        />

                        <div className="security-panel">
                            <div className="security-panel-icon">
                                <Shield size={20} />
                            </div>

                            <div>
                                <strong>
                                    Authenticated session
                                </strong>

                                <p>
                                    Your SportSense AI account
                                    uses token-based
                                    authentication for protected
                                    application routes.
                                </p>
                            </div>

                            <span className="security-status">
                                Active
                            </span>
                        </div>
                    </section>

                    <section className="settings-card">
                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="settings-logout-button"
                        >
                            <div className="settings-navigation-main">
                                <div className="settings-navigation-icon logout">
                                    <LogOut size={20} />
                                </div>

                                <div>
                                    <h3>Logout</h3>

                                    <p>
                                        Sign out from your
                                        current SportSense AI
                                        session.
                                    </p>
                                </div>
                            </div>

                            <ChevronRight
                                size={21}
                                className="settings-arrow"
                            />
                        </button>
                    </section>

                    <section className="settings-card settings-danger-card">
                        <div className="settings-danger-heading">
                            <div className="settings-danger-icon">
                                <Trash2 size={20} />
                            </div>

                            <div>
                                <h2>
                                    Delete Account
                                </h2>

                                <p>
                                    Permanently remove your
                                    account and associated data.
                                </p>
                            </div>
                        </div>

                        <div className="settings-danger-warning">
                            <strong>
                                This action cannot be undone.
                            </strong>

                            <span>
                                Your account, profile and
                                associated application data may
                                be permanently deleted.
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={
                                deleteAccount
                            }
                            className="settings-delete-button"
                            disabled={
                                deleteLoading
                            }
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="sp-spin"
                                    />
                                    Deleting Account...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={17} />
                                    Delete My Account
                                </>
                            )}
                        </button>
                    </section>

                    <section className="settings-card">
                        <SettingsHeader
                            icon={<Info size={20} />}
                            title="About SportSense AI"
                            description="Platform information."
                        />

                        <p className="settings-about-text">
                            SportSense AI is an AI-powered Sports
                            Injury Risk Detection Platform that
                            analyzes athlete movement using
                            computer vision, pose estimation,
                            biomechanics, anomaly detection and
                            machine learning.
                        </p>

                        <div className="settings-version">
                            <span>
                                SportSense AI
                            </span>
                        </div>
                    </section>
                </div>

                {passwordOpen && (
                    <div
                        className="settings-modal-backdrop"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closePasswordModal();
                            }
                        }}
                    >
                        <div
                            className="settings-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="change-password-title"
                        >
                            <div className="settings-modal-header">
                                <div>
                                    <div className="settings-modal-icon">
                                        <Lock size={20} />
                                    </div>

                                    <h2 id="change-password-title">
                                        Change Password
                                    </h2>

                                    <p>
                                        Update your account password
                                        securely.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="settings-modal-close"
                                    onClick={
                                        closePasswordModal
                                    }
                                    disabled={
                                        passwordLoading
                                    }
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                className="settings-password-form"
                                onSubmit={
                                    changePassword
                                }
                            >
                                <PasswordField
                                    label="Current Password"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    type={
                                        showCurrentPassword
                                            ? "text"
                                            : "password"
                                    }
                                    onChange={(value) =>
                                        updatePasswordField(
                                            "currentPassword",
                                            value
                                        )
                                    }
                                    visible={
                                        showCurrentPassword
                                    }
                                    onToggle={() =>
                                        setShowCurrentPassword(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    autoComplete="current-password"
                                    disabled={
                                        passwordLoading
                                    }
                                />

                                <PasswordField
                                    label="New Password"
                                    value={
                                        passwordForm.newPassword
                                    }
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    onChange={(value) =>
                                        updatePasswordField(
                                            "newPassword",
                                            value
                                        )
                                    }
                                    visible={
                                        showNewPassword
                                    }
                                    onToggle={() =>
                                        setShowNewPassword(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    autoComplete="new-password"
                                    disabled={
                                        passwordLoading
                                    }
                                />

                                <PasswordField
                                    label="Confirm New Password"
                                    value={
                                        passwordForm.confirmPassword
                                    }
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    onChange={(value) =>
                                        updatePasswordField(
                                            "confirmPassword",
                                            value
                                        )
                                    }
                                    visible={
                                        showConfirmPassword
                                    }
                                    onToggle={() =>
                                        setShowConfirmPassword(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    autoComplete="new-password"
                                    disabled={
                                        passwordLoading
                                    }
                                />

                                {passwordError && (
                                    <div className="settings-error">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="settings-success">
                                        <Check size={17} />
                                        {passwordSuccess}
                                    </div>
                                )}

                                <div className="settings-password-hint">
                                    Minimum 8 characters. Use a
                                    strong password that you do not
                                    reuse elsewhere.
                                </div>

                                <div className="settings-modal-actions">
                                    <button
                                        type="button"
                                        className="settings-secondary-button"
                                        onClick={
                                            closePasswordModal
                                        }
                                        disabled={
                                            passwordLoading
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="settings-primary-button"
                                        disabled={
                                            passwordLoading
                                        }
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <Loader2
                                                    size={17}
                                                    className="sp-spin"
                                                />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={17} />
                                                Change Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </DashboardLayout>
    );
}

function AccountItem({
    label,
    value,
    capitalize = false,
}) {
    return (
        <div className="settings-account-item">
            <span>{label}</span>

            <strong
                style={{
                    textTransform:
                        capitalize
                            ? "capitalize"
                            : "none",
                }}
            >
                {value}
            </strong>
        </div>
    );
}

function SettingsHeader({
    icon,
    title,
    description,
}) {
    return (
        <div className="settings-heading">
            <div className="settings-heading-icon">
                {icon}
            </div>

            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}

function ThemeChoice({
    icon,
    title,
    description,
    selected,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`theme-choice ${
                selected ? "selected" : ""
            }`}
            onClick={onClick}
            aria-pressed={selected}
        >
            <div className="theme-choice-icon">
                {icon}
            </div>

            <div className="theme-choice-content">
                <strong>{title}</strong>
                <span>{description}</span>
            </div>

            <div
                className={`theme-choice-radio ${
                    selected ? "selected" : ""
                }`}
            >
                {selected && (
                    <Check size={14} />
                )}
            </div>
        </button>
    );
}

function NotificationRow({
    title,
    description,
    enabled,
    onChange,
}) {
    return (
        <div className="notification-row">
            <div className="notification-content">
                <div className="notification-title-row">
                    <strong>{title}</strong>

                    <span
                        className={`notification-state ${
                            enabled ? "on" : "off"
                        }`}
                    >
                        {enabled ? "ON" : "OFF"}
                    </span>
                </div>

                <p>{description}</p>
            </div>

            <button
                type="button"
                className={`settings-switch ${
                    enabled ? "enabled" : ""
                }`}
                onClick={onChange}
                aria-pressed={enabled}
                aria-label={`${title}: ${
                    enabled
                        ? "enabled"
                        : "disabled"
                }`}
            >
                <span />
            </button>
        </div>
    );
}

function PasswordField({
    label,
    value,
    type,
    onChange,
    visible,
    onToggle,
    autoComplete,
    disabled,
}) {
    return (
        <div className="settings-form-group">
            <label className="settings-form-label">
                {label}
            </label>

            <div className="settings-password-field">
                <input
                    className="settings-form-input"
                    type={type}
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    autoComplete={autoComplete}
                    required
                    disabled={disabled}
                    minLength={
                        label !==
                        "Current Password"
                            ? 8
                            : undefined
                    }
                />

                <button
                    type="button"
                    className="settings-password-toggle"
                    onClick={onToggle}
                    disabled={disabled}
                    aria-label={
                        visible
                            ? "Hide password"
                            : "Show password"
                    }
                >
                    {visible ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </button>
            </div>
        </div>
    );
}