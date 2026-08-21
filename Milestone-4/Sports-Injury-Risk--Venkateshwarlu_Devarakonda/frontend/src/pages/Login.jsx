import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const googleError = searchParams.get("google_error");

    const googleErrorMessage = {
    not_registered:
        "This Google account is not registered. Please register first.",
    oauth_failed:
        "Google authentication failed. Please try again.",
    server_error:
        "Something went wrong. Please try again.",
}[googleError] || "";
    const {
        login,
        isAuthenticated,
    } = useAuth();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [googleLoading, setGoogleLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard", {
                replace: true,
            });
        }
    }, [
        isAuthenticated,
        navigate,
    ]);

    const handleLogin = async (event) => {
        event.preventDefault();

        if (loading || googleLoading) {
            return;
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError(
                "Please enter your email address."
            );
            return;
        }

        if (!password) {
            setError(
                "Please enter your password."
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            await login(
                normalizedEmail,
                password
            );

            navigate("/dashboard", {
                replace: true,
            });
        } catch (err) {
            const detail =
                err?.response?.data?.detail;

            setError(
                typeof detail === "string" &&
                    detail.trim()
                    ? detail
                    : "Unable to login. Please check your email and password."
            );
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

        setError("");
        setGoogleLoading(true);

        const params =
            new URLSearchParams({
                prompt: "select_account",
            });

        window.location.assign(
            `${BACKEND_URL}/auth/google/login?${params.toString()}`
        );
    };

    return (
        <div className="auth-page">
            <div className="auth-topbar">
                <Link
                    to="/"
                    className="auth-back"
                >
                    <ArrowLeft
                        size={17}
                        strokeWidth={1.9}
                    />

                    <span>Home</span>
                </Link>

                <ThemeToggle />
            </div>

            <main className="auth-card">
                <div className="auth-card-heading">
                    <p className="eyebrow">
                        SPORTSense AI
                    </p>

                    <h1>
                        Welcome Back
                    </h1>

                    <p>
                        Login to access your
                        SportSense AI workspace.
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

                <form
                    onSubmit={handleLogin}
                    className="auth-form"
                >
                    <div className="form-group">
                        <label
                            htmlFor="login-email"
                            className="form-label"
                        >
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(
                                    event.target.value
                                );
                                setError("");
                            }}
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
                            htmlFor="login-password"
                            className="form-label"
                        >
                            Password
                        </label>

                        <div className="password-field">
                            <input
                                id="login-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(event) => {
                                    setPassword(
                                        event.target.value
                                    );
                                    setError("");
                                }}
                                placeholder="Enter your password"
                                className="form-input"
                                autoComplete="current-password"
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
                    </div>

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            googleLoading
                        }
                        className="btn btn-primary auth-submit"
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="auth-spinner"
                                />
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
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
                    className="google-button"
                    disabled={
                        loading ||
                        googleLoading
                    }
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
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create an account
                    </Link>
                </p>
            </main>
        </div>
    );
}