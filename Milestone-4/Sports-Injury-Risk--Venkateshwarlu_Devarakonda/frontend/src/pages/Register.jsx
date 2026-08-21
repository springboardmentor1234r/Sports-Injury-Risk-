import { useState } from "react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    Eye,
    EyeOff,
    ArrowLeft,
    UserPlus,
} from "lucide-react";

import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

const ROLES = [
    {
        value: "athlete",
        label: "Athlete",
        description:
            "Upload videos and view your movement and injury-risk analysis.",
    },
    {
        value: "coach",
        label: "Coach",
        description:
            "Monitor athletes, review reports and track performance.",
    },
    {
        value: "physiotherapist",
        label: "Physiotherapist",
        description:
            "Review biomechanical findings and rehabilitation insights.",
    },
    {
        value: "sports_scientist",
        label: "Sports Scientist",
        description:
            "Analyze movement data, biomechanics and performance trends.",
    },
];

export default function Register() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const googleError = searchParams.get("google_error");

    const googleErrorMessage = {
    already_registered:
        "This Google account is already registered. Please login instead.",
    role_required:
        "Please select an account role before continuing with Google.",
}[googleError] || "";

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "athlete",
    });

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [googleLoading, setGoogleLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const validateForm = () => {
        const username =
            form.username.trim();

        const email =
            form.email.trim().toLowerCase();

        if (!username) {
            return "Please enter a username.";
        }

        if (username.length < 3) {
            return "Username must contain at least 3 characters.";
        }

        if (!email) {
            return "Please enter your email.";
        }

        if (form.password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (
            form.password !==
            confirmPassword
        ) {
            return "Passwords do not match.";
        }

        if (
            !ROLES.some(
                (role) =>
                    role.value ===
                    form.role
            )
        ) {
            return "Please select a valid role.";
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            loading ||
            googleLoading
        ) {
            return;
        }

        setError("");
        setSuccess("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            await api.post(
                "/auth/register",
                {
                    username:
                        form.username.trim(),
                    email:
                        form.email
                            .trim()
                            .toLowerCase(),
                    password:
                        form.password,
                    role:
                        form.role,
                }
            );

            setSuccess(
                "Account created successfully. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                });
            }, 1200);
        } catch (err) {
            const detail =
                err?.response?.data?.detail;

            if (Array.isArray(detail)) {
                setError(
                    detail
                        .map(
                            (item) =>
                                item?.msg ||
                                "Registration failed."
                        )
                        .join(" ")
                );
            } else {
                setError(
                    detail ||
                    err?.response?.data?.message ||
                    "Registration failed. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const continueWithGoogle = () => {
        if (
            loading ||
            googleLoading
        ) {
            return;
        }

        const validRole =
            ROLES.some(
                (role) =>
                    role.value ===
                    form.role
            );

        if (!validRole) {
            setError(
                "Please select an account role before continuing with Google."
            );
            return;
        }

        setError("");
        setSuccess("");
        setGoogleLoading(true);

        const params =
            new URLSearchParams({
                role: form.role,
                prompt: "select_account",
            });

        window.location.assign(
            `${BACKEND_URL}/auth/google/login?${params.toString()}`
        );
    };

    const selectedRole =
        ROLES.find(
            (role) =>
                role.value ===
                form.role
        );

    return (
        <div className="auth-page">
            <div className="auth-topbar">
                <Link
                    to="/"
                    className="auth-back"
                >
                    <ArrowLeft size={17} />
                    <span>Home</span>
                </Link>

                <ThemeToggle />
            </div>

            <main className="auth-card">
                <div className="auth-card-heading">
                    <div className="auth-icon">
                        <UserPlus size={22} />
                    </div>

                    <p className="eyebrow">
                        SPORTSense AI
                    </p>

                    <h1>
                        Create Account
                    </h1>

                    <p>
                        Join SportSense AI and
                        start using intelligent
                        sports movement analysis.
                    </p>
                </div>

                {error && (
                    <div
                        className="auth-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="auth-success"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="auth-form"
                >
                    <div className="form-group">
                        <label
                            htmlFor="username"
                            className="form-label"
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            className="form-input"
                            autoComplete="username"
                            disabled={
                                loading ||
                                googleLoading
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="email"
                            className="form-label"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="form-input"
                            autoComplete="email"
                            disabled={
                                loading ||
                                googleLoading
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="password"
                            className="form-label"
                        >
                            Password
                        </label>

                        <div className="password-field">
                            <input
                                id="password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                className="form-input"
                                autoComplete="new-password"
                                disabled={
                                    loading ||
                                    googleLoading
                                }
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (current) =>
                                            !current
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={
                                    loading ||
                                    googleLoading
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        <small className="form-help">
                            Minimum 8 characters.
                        </small>
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="confirmPassword"
                            className="form-label"
                        >
                            Confirm Password
                        </label>

                        <div className="password-field">
                            <input
                                id="confirmPassword"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    confirmPassword
                                }
                                onChange={(event) => {
                                    setConfirmPassword(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                placeholder="Confirm your password"
                                className="form-input"
                                autoComplete="new-password"
                                disabled={
                                    loading ||
                                    googleLoading
                                }
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (current) =>
                                            !current
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={
                                    loading ||
                                    googleLoading
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="role"
                            className="form-label"
                        >
                            Account Role
                        </label>

                        <select
                            id="role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="form-select"
                            disabled={
                                loading ||
                                googleLoading
                            }
                            required
                        >
                            {ROLES.map((role) => (
                                <option
                                    key={role.value}
                                    value={role.value}
                                >
                                    {role.label}
                                </option>
                            ))}
                        </select>

                        <small className="form-help">
                            {
                                selectedRole?.description
                            }
                        </small>
                    </div>

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            googleLoading
                        }
                        className="btn btn-primary auth-submit"
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>
                </form>

                <div
                    className="auth-divider"
                    aria-hidden="true"
                >
                    <span>OR</span>
                </div>

                <button
                    type="button"
                    onClick={
                        continueWithGoogle
                    }
                    disabled={
                        loading ||
                        googleLoading
                    }
                    className="google-button"
                >
                    <span
    className="google-icon"
    aria-hidden="true"
>
    <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            fill="#4285F4"
            d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.4z"
        />
        <path
            fill="#34A853"
            d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.75z"
        />
        <path
            fill="#FBBC05"
            d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.52z"
        />
        <path
            fill="#EA4335"
            d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.21 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.64l3.24 2.52C7.31 7.85 9.46 6.13 12 6.13z"
        />
    </svg>
</span>

                    <span>
                        {googleLoading
                            ? "Connecting..."
                            : "Continue with Google"}
                    </span>
                </button>
                {googleErrorMessage && (
    <div
        className="google-error-message"
        role="alert"
    >
        {googleErrorMessage}
    </div>
)}

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>
            </main>
        </div>
    );
}