import {
    Routes,
    Route,
} from "react-router-dom";

import Landing
    from "./pages/Landing";

import Login
    from "./pages/Login";

import Register
    from "./pages/Register";

import GoogleCallback
    from "./pages/GoogleCallback";

import Dashboard
    from "./pages/Dashboard";

import UploadVideo
    from "./pages/UploadVideo";

import History
    from "./pages/History";

import Analysis
    from "./pages/Analysis";

import Reports
    from "./pages/Reports";

import Profile
    from "./pages/Profile";

import EditProfile
    from "./pages/EditProfile";

import Settings
    from "./pages/Settings";

import NotFound
    from "./pages/NotFound";

import ProtectedRoute
    from "./components/ProtectedRoute";

import {
    ROLES,
    ATHLETE_ROLES,
    PROFESSIONAL_ROLES,
    ALL_ROLES,
    VIDEO_UPLOAD_ROLES,
    ANALYSIS_ROLES,
    REPORT_ROLES,
} from "./context/AuthContext";

export {
    ROLES,
    ATHLETE_ROLES,
    PROFESSIONAL_ROLES,
    ALL_ROLES,
    VIDEO_UPLOAD_ROLES,
    ANALYSIS_ROLES,
    REPORT_ROLES,
};

export default function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Landing />
                }
            />

            <Route
                path="/login"
                element={
                    <Login />
                }
            />

            <Route
                path="/register"
                element={
                    <Register />
                }
            />

            <Route
                path="/oauth/callback"
                element={
                    <GoogleCallback />
                }
            />

            <Route
                path="/google-callback"
                element={
                    <GoogleCallback />
                }
            />

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={
                            ALL_ROLES
                        }
                    />
                }
            >
                <Route
                    path="/dashboard"
                    element={
                        <Dashboard />
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <Profile />
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <Settings />
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={
                            ATHLETE_ROLES
                        }
                    />
                }
            >
                <Route
                    path="/profile/edit"
                    element={
                        <EditProfile />
                    }
                />

                <Route
                    path="/history"
                    element={
                        <History />
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={
                            VIDEO_UPLOAD_ROLES
                        }
                    />
                }
            >
                <Route
                    path="/upload"
                    element={
                        <UploadVideo />
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={
                            ANALYSIS_ROLES
                        }
                    />
                }
            >
                <Route
                    path="/analysis"
                    element={
                        <Analysis />
                    }
                />

                <Route
                    path="/analysis/:videoId"
                    element={
                        <Analysis />
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={
                            REPORT_ROLES
                        }
                    />
                }
            >
                <Route
                    path="/reports"
                    element={
                        <Reports />
                    }
                />
            </Route>

            <Route
                path="*"
                element={
                    <NotFound />
                }
            />
        </Routes>
    );
}