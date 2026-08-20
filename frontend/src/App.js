import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { AnalysisProvider } from "./context/AnalysisContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachDashboard from "./pages/CoachDashboard";

import Admin from "./pages/Admin";
import Athlete from "./pages/Athlete";
import UploadVideo from "./pages/UploadVideo";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";


// =====================================================
// DASHBOARD REDIRECT
// =====================================================

function DashboardRedirect() {

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    // No logged-in user
    if (!user || !user.role) {
        return <Navigate to="/login" replace />;
    }

    const role = user.role.toLowerCase();

    // Redirect according to role
    switch (role) {

        case "admin":
            return (
                <Navigate
                    to="/dashboard/admin-home"
                    replace
                />
            );

        case "coach":
            return (
                <Navigate
                    to="/dashboard/coach-home"
                    replace
                />
            );

        case "athlete":
            return (
                <Navigate
                    to="/dashboard/athlete-home"
                    replace
                />
            );

        default:
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
    }
}


// =====================================================
// APP
// =====================================================

function App() {

    return (

        <AnalysisProvider>

                <Routes>

                    {/* =================================================
                        PUBLIC ROUTES
                    ================================================= */}

                    <Route
                        path="/"
                        element={
                            <>
                                <Home />
                                <Footer />
                            </>
                        }
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />


                    {/* =================================================
                        MAIN DASHBOARD
                        Automatically detects user role
                    ================================================= */}

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <DashboardRedirect />
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        ADMIN DASHBOARD
                    ================================================= */}

                    <Route
                        path="/dashboard/admin-home"
                        element={
                            <ProtectedRoute
                                allowedRoles={["admin"]}
                            >
                                <Layout>
                                    <AdminDashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        ADMIN USER MANAGEMENT
                    ================================================= */}

                    <Route
                        path="/dashboard/admin"
                        element={
                            <ProtectedRoute
                                allowedRoles={["admin"]}
                            >
                                <Layout>
                                    <Admin />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        COACH DASHBOARD
                    ================================================= */}

                    <Route
                        path="/dashboard/coach-home"
                        element={
                            <ProtectedRoute
                                allowedRoles={["coach"]}
                            >
                                <Layout>
                                    <CoachDashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        ATHLETE DASHBOARD
                    ================================================= */}

                    <Route
                        path="/dashboard/athlete-home"
                        element={
                            <ProtectedRoute
                                allowedRoles={["athlete"]}
                            >
                                <Layout>
                                    <AthleteDashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        ATHLETES
                        Admin + Coach only
                    ================================================= */}

                    <Route
                        path="/dashboard/athletes"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach"
                                ]}
                            >
                                <Layout>
                                    <Athlete />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        UPLOAD VIDEO
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/upload"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <UploadVideo />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        ANALYSIS
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/analysis"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <Analysis />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        REPORTS
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/reports"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <Reports />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        HISTORY
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/history"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <History />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        SETTINGS
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/settings"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <Settings />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        HELP
                        All roles
                    ================================================= */}

                    <Route
                        path="/dashboard/help"
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "admin",
                                    "coach",
                                    "athlete"
                                ]}
                            >
                                <Layout>
                                    <Help />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />


                    {/* =================================================
                        404 PAGE
                    ================================================= */}

                    <Route
                        path="*"
                        element={<NotFound />}
                    />

                </Routes>


        </AnalysisProvider>
    );
}


export default App;