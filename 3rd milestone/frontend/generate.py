import os

base_dir = r"f:\sport\frontend"

directories = [
    "src/styles",
    "src/store/slices",
    "src/services",
    "src/hooks",
    "src/utils",
    "src/components/common",
    "src/components/auth",
    "src/components/athlete",
    "src/components/video",
    "src/components/analysis",
    "src/components/dashboard",
    "src/components/reports",
    "src/pages",
    "src/layouts",
    "src/routes"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

# Redux slices
auth_slice = """import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => { state.loading = true; state.error = null; },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    checkAuth: (state) => {
      const user = localStorage.getItem('user');
      if (user) {
        state.isAuthenticated = true;
        state.user = JSON.parse(user);
      }
      state.loading = false;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, checkAuth } = authSlice.actions;
export default authSlice.reducer;
"""
write_file("src/store/slices/authSlice.js", auth_slice)

athlete_slice = """import { createSlice } from '@reduxjs/toolkit';
const athleteSlice = createSlice({ name: 'athlete', initialState: { athletes: [] }, reducers: {} });
export default athleteSlice.reducer;"""
write_file("src/store/slices/athleteSlice.js", athlete_slice)

video_slice = """import { createSlice } from '@reduxjs/toolkit';
const videoSlice = createSlice({ name: 'video', initialState: { videos: [] }, reducers: {} });
export default videoSlice.reducer;"""
write_file("src/store/slices/videoSlice.js", video_slice)

analysis_slice = """import { createSlice } from '@reduxjs/toolkit';
const analysisSlice = createSlice({ name: 'analysis', initialState: { analyses: [] }, reducers: {} });
export default analysisSlice.reducer;"""
write_file("src/store/slices/analysisSlice.js", analysis_slice)

dashboard_slice = """import { createSlice } from '@reduxjs/toolkit';
const dashboardSlice = createSlice({ name: 'dashboard', initialState: { stats: null }, reducers: {} });
export default dashboardSlice.reducer;"""
write_file("src/store/slices/dashboardSlice.js", dashboard_slice)

notification_slice = """import { createSlice } from '@reduxjs/toolkit';
const notificationSlice = createSlice({ name: 'notification', initialState: { notifications: [] }, reducers: {} });
export default notificationSlice.reducer;"""
write_file("src/store/slices/notificationSlice.js", notification_slice)


# Routes
routes_js = """import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
"""
write_file("src/routes/routes.js", routes_js)

protected_route = """import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
"""
write_file("src/routes/ProtectedRoute.js", protected_route)
write_file("src/routes/ProtectedRoute.jsx", protected_route)

# Pages
login_page = """import React from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = () => {
    dispatch(loginSuccess({ id: 1, name: 'Test User' }));
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }));
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="glass p-8 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login to SportsRisk</h2>
        <button onClick={handleLogin} className="w-full bg-primary text-white py-2 rounded-lg">Mock Login</button>
      </div>
    </div>
  );
}
"""
write_file("src/pages/LoginPage.jsx", login_page)

dashboard_page = """import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Total Athletes</h3>
          <p className="text-3xl font-bold text-primary">24</p>
        </div>
      </div>
    </div>
  );
}
"""
write_file("src/pages/DashboardPage.jsx", dashboard_page)

not_found = """import React from 'react';
export default function NotFoundPage() {
  return <div className="p-8 text-center"><h1 className="text-4xl">404 Not Found</h1></div>;
}
"""
write_file("src/pages/NotFoundPage.jsx", not_found)

print("Files generated successfully.")
