import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

const TOKEN_KEY = "token";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000,
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem(
                TOKEN_KEY
            );

        if (token) {
            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) =>
        Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) =>
        Promise.reject(error)
);

export const authApi = {
    register(data) {
        return api.post(
            "/auth/register",
            data
        );
    },

    login(data) {
        return api.post(
            "/auth/login",
            data
        );
    },

    me() {
        return api.get("/auth/me");
    },

    deleteAccount() {
        return api.delete(
            "/auth/delete-account"
        );
    },

    googleLogin(role) {
        const params =
            new URLSearchParams({
                prompt: "select_account",
            });

        if (role) {
            params.set(
                "role",
                String(role)
                    .trim()
                    .toLowerCase()
            );
        }

        window.location.assign(
            `${API_BASE_URL}/auth/google/login?${params.toString()}`
        );
    },
};

export const athleteApi = {
    createProfile(data) {
        return api.post(
            "/athlete/profile",
            data
        );
    },

    getProfile() {
        return api.get(
            "/athlete/profile"
        );
    },

    updateProfile(data) {
        return api.put(
            "/athlete/profile",
            data
        );
    },

    deleteProfile() {
        return api.delete(
            "/athlete/profile"
        );
    },
};

export const videoApi = {
    upload(file, onUploadProgress) {
        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        return api.post(
            "/video/upload",
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
                onUploadProgress,
            }
        );
    },

    history() {
        return api.get(
            "/video/history"
        );
    },

    dashboard() {
        return api.get(
            "/video/dashboard"
        );
    },

    analysis(videoId) {
        return api.get(
            `/video/analysis/${videoId}`
        );
    },

    downloadReport(videoId) {
        return api.get(
            `/video/report/${videoId}`,
            {
                responseType: "blob",
            }
        );
    },
};

export const injuryApi = {
    createReport(data) {
        return api.post(
            "/injury/report",
            data
        );
    },

    history() {
        return api.get(
            "/injury/history"
        );
    },

    getReport(reportId) {
        return api.get(
            `/injury/${reportId}`
        );
    },

    updateReport(reportId, data) {
        return api.put(
            `/injury/${reportId}`,
            data
        );
    },

    deleteReport(reportId) {
        return api.delete(
            `/injury/${reportId}`
        );
    },
};

export const chatApi = {
    conversations() {
        return api.get(
            "/chat/conversations"
        );
    },

    messages(conversationId) {
        return api.get(
            `/chat/conversations/${conversationId}/messages`
        );
    },

    sendMessage(
        conversationId,
        data
    ) {
        return api.post(
            `/chat/conversations/${conversationId}/messages`,
            data
        );
    },

    startConversation(data) {
        return api.post(
            "/chat/conversations",
            data
        );
    },

    markRead(conversationId) {
        return api.patch(
            `/chat/conversations/${conversationId}/read`
        );
    },
};

export const systemApi = {
    health() {
        return api.get("/health");
    },
};

export function getToken() {
    try {
        return localStorage.getItem(
            TOKEN_KEY
        );
    } catch {
        return null;
    }
}

export function saveAuthData({
    token,
    username,
    email,
    role,
    user,
}) {
    try {
        if (token) {
            localStorage.setItem(
                TOKEN_KEY,
                token
            );
        }

        if (username) {
            localStorage.setItem(
                "username",
                username
            );
        }

        if (email) {
            localStorage.setItem(
                "email",
                email
            );
        }

        if (role) {
            localStorage.setItem(
                "role",
                role
            );
        }

        if (user) {
            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );
        }
    } catch (error) {
        console.warn(
            "Unable to save authentication data:",
            error
        );
    }
}

export function clearAuthData() {
    try {
        [
            TOKEN_KEY,
            "username",
            "email",
            "role",
            "user",
        ].forEach((key) => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.warn(
            "Unable to clear authentication data:",
            error
        );
    }
}

export function getStoredUser() {
    try {
        const storedUser =
            localStorage.getItem(
                "user"
            );

        if (!storedUser) {
            return null;
        }

        return JSON.parse(
            storedUser
        );
    } catch {
        return null;
    }
}

export default api;