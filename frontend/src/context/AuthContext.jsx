import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../services/api";

export const ROLES = Object.freeze({
    ATHLETE: "athlete",
    COACH: "coach",
    PHYSIOTHERAPIST: "physiotherapist",
    SPORTS_SCIENTIST: "sports_scientist",
    ADMIN: "admin",
});

export const ROLE_LABELS = Object.freeze({
    [ROLES.ATHLETE]: "Athlete",
    [ROLES.COACH]: "Coach",
    [ROLES.PHYSIOTHERAPIST]: "Physiotherapist",
    [ROLES.SPORTS_SCIENTIST]: "Sports Scientist",
    [ROLES.ADMIN]: "Administrator",
});

export const ATHLETE_ROLES = Object.freeze([
    ROLES.ATHLETE,
]);

export const PROFESSIONAL_ROLES = Object.freeze([
    ROLES.COACH,
    ROLES.PHYSIOTHERAPIST,
    ROLES.SPORTS_SCIENTIST,
]);

export const ALL_ROLES = Object.freeze([
    ROLES.ATHLETE,
    ROLES.COACH,
    ROLES.PHYSIOTHERAPIST,
    ROLES.SPORTS_SCIENTIST,
    ROLES.ADMIN,
]);

export const REGISTRATION_ROLES = Object.freeze([
    ROLES.ATHLETE,
    ROLES.COACH,
    ROLES.PHYSIOTHERAPIST,
    ROLES.SPORTS_SCIENTIST,
]);

export const VIDEO_UPLOAD_ROLES = Object.freeze([
    ROLES.ATHLETE,
    ROLES.COACH,
]);

export const ANALYSIS_ROLES = Object.freeze([
    ROLES.ATHLETE,
    ROLES.COACH,
    ROLES.PHYSIOTHERAPIST,
    ROLES.SPORTS_SCIENTIST,
    ROLES.ADMIN,
]);

export const REPORT_ROLES = Object.freeze([
    ROLES.ATHLETE,
    ROLES.COACH,
    ROLES.PHYSIOTHERAPIST,
    ROLES.SPORTS_SCIENTIST,
    ROLES.ADMIN,
]);

const TOKEN_KEY = "token";
const USER_KEY = "user";
const TOKEN_TYPE_KEY = "token_type";

const PROFILE_KEYS = [
    "athleteProfile",
    "coachProfile",
    "physiotherapistProfile",
    "sportsScientistProfile",
];

const AuthContext = createContext(null);

export function normalizeRole(role) {
    if (!role) {
        return null;
    }

    const normalized = String(role)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const aliases = {
        athlete: ROLES.ATHLETE,
        coach: ROLES.COACH,
        physiotherapist: ROLES.PHYSIOTHERAPIST,
        physiotherapist_profile: ROLES.PHYSIOTHERAPIST,
        sports_scientist: ROLES.SPORTS_SCIENTIST,
        sport_scientist: ROLES.SPORTS_SCIENTIST,
        sportsscientist: ROLES.SPORTS_SCIENTIST,
        sports_scientist_profile: ROLES.SPORTS_SCIENTIST,
        admin: ROLES.ADMIN,
        administrator: ROLES.ADMIN,
    };

    return aliases[normalized] || normalized;
}

export function isValidRole(role) {
    return ALL_ROLES.includes(
        normalizeRole(role)
    );
}

export function isRegistrationRole(role) {
    return REGISTRATION_ROLES.includes(
        normalizeRole(role)
    );
}

export function canUploadVideo(role) {
    return VIDEO_UPLOAD_ROLES.includes(
        normalizeRole(role)
    );
}

export function canAccessAnalysis(role) {
    return ANALYSIS_ROLES.includes(
        normalizeRole(role)
    );
}

export function canAccessReports(role) {
    return REPORT_ROLES.includes(
        normalizeRole(role)
    );
}

export function canManageAthletes(role) {
    return [
        ROLES.COACH,
        ROLES.PHYSIOTHERAPIST,
        ROLES.SPORTS_SCIENTIST,
        ROLES.ADMIN,
    ].includes(normalizeRole(role));
}

export function getRoleLabel(role) {
    return (
        ROLE_LABELS[normalizeRole(role)] ||
        "User"
    );
}

export function getStoredToken() {
    try {
        return localStorage.getItem(
            TOKEN_KEY
        );
    } catch {
        return null;
    }
}

export function getStoredUser() {
    try {
        const stored =
            localStorage.getItem(
                USER_KEY
            );

        if (!stored) {
            return null;
        }

        const parsed =
            JSON.parse(stored);

        if (
            !parsed ||
            typeof parsed !== "object"
        ) {
            return null;
        }

        return {
            ...parsed,
            role: normalizeRole(
                parsed.role
            ),
        };
    } catch {
        return null;
    }
}

export function saveSession(
    token,
    user
) {
    try {
        if (token) {
            localStorage.setItem(
                TOKEN_KEY,
                token
            );
        }

        if (!user) {
            return;
        }

        const normalizedUser = {
            ...user,
            role: normalizeRole(
                user.role
            ),
        };

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                normalizedUser
            )
        );

        if (
            normalizedUser.username
        ) {
            localStorage.setItem(
                "username",
                normalizedUser.username
            );
        }

        if (
            normalizedUser.email
        ) {
            localStorage.setItem(
                "email",
                normalizedUser.email
            );
        }

        if (
            normalizedUser.role
        ) {
            localStorage.setItem(
                "role",
                normalizedUser.role
            );
        }
    } catch (error) {
        console.warn(
            "Unable to save authentication session:",
            error
        );
    }
}

export function clearSession() {
    try {
        [
            TOKEN_KEY,
            USER_KEY,
            "username",
            "email",
            "role",
            TOKEN_TYPE_KEY,
            ...PROFILE_KEYS,
        ].forEach((key) => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.warn(
            "Unable to clear authentication session:",
            error
        );
    }
}

export function buildUser(
    data = {},
    fallback = {}
) {
    const nestedUser =
        data.user &&
        typeof data.user === "object"
            ? data.user
            : {};

    const merged = {
        ...fallback,
        ...nestedUser,
        ...data,
    };

    return {
        ...merged,
        id:
            merged.id ??
            merged.user_id ??
            null,
        email:
            merged.email ??
            fallback.email ??
            null,
        username:
            merged.username ??
            merged.full_name ??
            fallback.username ??
            null,
        role: normalizeRole(
            merged.role ?? null
        ),
    };
}

export function AuthProvider({
    children,
}) {
    const [token, setToken] =
        useState(getStoredToken);

    const [user, setUser] =
        useState(getStoredUser);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common.Authorization =
                `Bearer ${token}`;
        } else {
            delete api.defaults.headers
                .common
                .Authorization;
        }
    }, [token]);

    useEffect(() => {
        let mounted = true;

        async function restoreSession() {
            const storedToken =
                getStoredToken();

            if (!storedToken) {
                if (mounted) {
                    setToken(null);
                    setUser(null);
                    setLoading(false);
                }

                return;
            }

            api.defaults.headers.common.Authorization =
                `Bearer ${storedToken}`;

            try {
                const response =
                    await api.get(
                        "/auth/me"
                    );

                const backendUser =
                    response?.data?.user ||
                    response?.data ||
                    {};

                const currentUser =
                    buildUser(
                        backendUser
                    );

                if (!currentUser.role) {
                    throw new Error(
                        "Authenticated user role is missing."
                    );
                }

                if (
                    !isValidRole(
                        currentUser.role
                    )
                ) {
                    throw new Error(
                        "Authenticated user has an invalid role."
                    );
                }

                if (!mounted) {
                    return;
                }

                setToken(
                    storedToken
                );

                setUser(
                    currentUser
                );

                saveSession(
                    storedToken,
                    currentUser
                );
            } catch (requestError) {
                if (!mounted) {
                    return;
                }

                clearSession();

                delete api.defaults.headers
                    .common
                    .Authorization;

                setToken(null);
                setUser(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            mounted = false;
        };
    }, []);

    async function login(
        email,
        password
    ) {
        setLoading(true);
        setError(null);

        try {
            const normalizedEmail =
                email
                    ?.trim()
                    .toLowerCase();

            if (!normalizedEmail) {
                throw new Error(
                    "Email is required."
                );
            }

            if (!password) {
                throw new Error(
                    "Password is required."
                );
            }

            const response =
                await api.post(
                    "/auth/login",
                    {
                        email:
                            normalizedEmail,
                        password,
                    }
                );

            const data =
                response?.data || {};

            const accessToken =
                data.access_token;

            if (!accessToken) {
                throw new Error(
                    "Login succeeded but no access token was returned."
                );
            }

            const loggedInUser =
                buildUser(
                    data,
                    {
                        email:
                            normalizedEmail,
                    }
                );

            if (!loggedInUser.role) {
                throw new Error(
                    "Login succeeded but user role was not returned."
                );
            }

            if (
                !isValidRole(
                    loggedInUser.role
                )
            ) {
                throw new Error(
                    "The account has an invalid role."
                );
            }

            setToken(
                accessToken
            );

            setUser(
                loggedInUser
            );

            api.defaults.headers.common.Authorization =
                `Bearer ${accessToken}`;

            saveSession(
                accessToken,
                loggedInUser
            );

            return {
                success: true,
                user: loggedInUser,
                token: accessToken,
                role: loggedInUser.role,
            };
        } catch (requestError) {
            const message =
                requestError
                    ?.response
                    ?.data
                    ?.detail ||
                requestError
                    ?.response
                    ?.data
                    ?.message ||
                requestError
                    ?.message ||
                "Login failed.";

            setError(message);

            clearSession();

            setToken(null);
            setUser(null);

            delete api.defaults.headers
                .common
                .Authorization;

            throw requestError;
        } finally {
            setLoading(false);
        }
    }

    async function register(
        userData
    ) {
        setLoading(true);
        setError(null);

        try {
            const role =
                normalizeRole(
                    userData?.role
                );

            if (
                !isRegistrationRole(
                    role
                )
            ) {
                throw new Error(
                    "Invalid registration role."
                );
            }

            const username =
                userData?.username
                    ?.trim();

            const email =
                userData?.email
                    ?.trim()
                    .toLowerCase();

            const password =
                userData?.password;

            if (!username) {
                throw new Error(
                    "Username is required."
                );
            }

            if (!email) {
                throw new Error(
                    "Email is required."
                );
            }

            if (!password) {
                throw new Error(
                    "Password is required."
                );
            }

            const response =
                await api.post(
                    "/auth/register",
                    {
                        username,
                        email,
                        password,
                        role,
                    }
                );

            return {
                success: true,
                user:
                    response?.data ||
                    null,
            };
        } catch (requestError) {
            const message =
                requestError
                    ?.response
                    ?.data
                    ?.detail ||
                requestError
                    ?.response
                    ?.data
                    ?.message ||
                requestError
                    ?.message ||
                "Registration failed.";

            setError(message);

            return {
                success: false,
                error: message,
            };
        } finally {
            setLoading(false);
        }
    }

    const completeGoogleLogin =
        useCallback(
            (data) => {
                const accessToken =
                    data?.access_token;

                if (!accessToken) {
                    throw new Error(
                        "Google authentication succeeded but no access token was received."
                    );
                }

                const googleUser =
                    buildUser(data);

                if (!googleUser.email) {
                    throw new Error(
                        "Google authentication did not return an email address."
                    );
                }

                if (!googleUser.role) {
                    throw new Error(
                        "Google authentication succeeded but no user role was received."
                    );
                }

                if (
                    !isValidRole(
                        googleUser.role
                    )
                ) {
                    throw new Error(
                        "Google authentication returned an invalid user role."
                    );
                }

                setToken(
                    accessToken
                );

                setUser(
                    googleUser
                );

                api.defaults.headers.common.Authorization =
                    `Bearer ${accessToken}`;

                saveSession(
                    accessToken,
                    googleUser
                );

                if (
                    data?.token_type
                ) {
                    localStorage.setItem(
                        TOKEN_TYPE_KEY,
                        data.token_type
                    );
                }

                setError(null);

                return {
                    success: true,
                    user: googleUser,
                    token: accessToken,
                    role: googleUser.role,
                };
            },
            []
        );

    function logout() {
        clearSession();

        delete api.defaults.headers
            .common
            .Authorization;

        setToken(null);
        setUser(null);
        setError(null);
    }

    async function refreshUser() {
        if (!token) {
            return null;
        }

        try {
            const response =
                await api.get(
                    "/auth/me"
                );

            const backendUser =
                response?.data?.user ||
                response?.data ||
                {};

            const currentUser =
                buildUser(
                    backendUser
                );

            if (!currentUser.role) {
                throw new Error(
                    "User role is missing."
                );
            }

            if (
                !isValidRole(
                    currentUser.role
                )
            ) {
                throw new Error(
                    "User role is invalid."
                );
            }

            setUser(
                currentUser
            );

            saveSession(
                token,
                currentUser
            );

            return currentUser;
        } catch (requestError) {
            logout();
            return null;
        }
    }

    function hasRole(
        ...allowedRoles
    ) {
        const currentRole =
            normalizeRole(
                user?.role
            );

        if (!currentRole) {
            return false;
        }

        return allowedRoles
            .map(normalizeRole)
            .includes(currentRole);
    }

    const role =
        normalizeRole(
            user?.role
        );

    const roleLabel =
        getRoleLabel(role);

    const isAuthenticated =
        Boolean(
            token && user
        );

    const value = useMemo(
        () => ({
            token,
            user,
            role,
            roleLabel,
            isAuthenticated,
            loading,
            error,

            login,
            register,
            completeGoogleLogin,
            logout,
            refreshUser,
            hasRole,

            canUploadVideo:
                canUploadVideo(
                    role
                ),

            canAccessAnalysis:
                canAccessAnalysis(
                    role
                ),

            canAccessReports:
                canAccessReports(
                    role
                ),

            canManageAthletes:
                canManageAthletes(
                    role
                ),

            isAthlete: () =>
                hasRole(
                    ROLES.ATHLETE
                ),

            isCoach: () =>
                hasRole(
                    ROLES.COACH
                ),

            isPhysiotherapist: () =>
                hasRole(
                    ROLES.PHYSIOTHERAPIST
                ),

            isSportsScientist: () =>
                hasRole(
                    ROLES.SPORTS_SCIENTIST
                ),

            isAdmin: () =>
                hasRole(
                    ROLES.ADMIN
                ),

            roles: ROLES,
            roleLabels:
                ROLE_LABELS,

            clearError: () =>
                setError(null),
        }),
        [
            token,
            user,
            role,
            roleLabel,
            isAuthenticated,
            loading,
            error,
            completeGoogleLogin,
        ]
    );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(
            AuthContext
        );

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}

export default AuthContext;