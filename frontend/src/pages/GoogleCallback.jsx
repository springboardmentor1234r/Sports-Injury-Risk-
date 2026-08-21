import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { Loader2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function GoogleCallback() {
    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const {
        completeGoogleLogin,
    } = useAuth();

    const [error, setError] =
        useState("");

    const [processing, setProcessing] =
        useState(true);

    useEffect(() => {
        let mounted = true;

        const processGoogleLogin =
            async () => {
                try {
                    const accessToken =
                        searchParams.get(
                            "access_token"
                        );

                    const tokenType =
                        searchParams.get(
                            "token_type"
                        ) || "bearer";

                    const username =
                        searchParams.get(
                            "username"
                        ) || "";

                    const email =
                        searchParams.get(
                            "email"
                        ) || "";

                    const role =
                        searchParams.get(
                            "role"
                        );

                    if (!accessToken) {
                        throw new Error(
                            "Google authentication failed. Access token was not received."
                        );
                    }

                    if (!email) {
                        throw new Error(
                            "Google authentication failed. Email was not received."
                        );
                    }

                    const result =
                        completeGoogleLogin({
                            access_token:
                                accessToken,
                            token_type:
                                tokenType,
                            username,
                            email,
                            role,
                        });

                    if (
                        !result?.success
                    ) {
                        throw new Error(
                            "Unable to create the authenticated session."
                        );
                    }

                    if (!mounted) {
                        return;
                    }

                    setProcessing(false);

                    navigate(
                        "/dashboard",
                        {
                            replace: true,
                        }
                    );
                } catch (err) {
                    if (!mounted) {
                        return;
                    }

                    setProcessing(false);

                    setError(
                        err?.message ||
                        "Unable to complete Google authentication."
                    );
                }
            };

        processGoogleLogin();

        return () => {
            mounted = false;
        };
    }, [
        navigate,
        searchParams,
        completeGoogleLogin,
    ]);

    if (error) {
        return (
            <div
                className="auth-page"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div className="auth-card">
                    <div className="auth-card-heading">
                        <p className="eyebrow">
                            SPORTSense AI
                        </p>

                        <h1>
                            Google Login Failed
                        </h1>
                    </div>

                    <div
                        className="auth-error"
                        role="alert"
                    >
                        {error}
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary auth-submit"
                        onClick={() =>
                            navigate(
                                "/login",
                                {
                                    replace: true,
                                }
                            )
                        }
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="auth-page"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div className="auth-card">
                <div
                    className="auth-card-heading"
                    style={{
                        textAlign: "center",
                    }}
                >
                    {processing && (
                        <Loader2
                            size={40}
                            className="auth-spinner"
                        />
                    )}

                    <h2>
                        Signing you in...
                    </h2>

                    <p>
                        Completing Google authentication.
                    </p>
                </div>
            </div>
        </div>
    );
}