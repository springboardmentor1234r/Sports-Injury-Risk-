import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Athlete from "./pages/Athlete";
import UploadVideo from "./pages/UploadVideo";
import NotFound from "./pages/NotFound";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import History from "./pages/History";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

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

        {/* ================= DASHBOARD ================= */}

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/dashboard/athletes"
          element={
            <Layout>
              <Athlete />
            </Layout>
          }
        />

        <Route
          path="/dashboard/upload"
          element={
            <Layout>
              <UploadVideo />
            </Layout>
          }
        />

        {/* ================= FUTURE MODULES ================= */}

        <Route
            path="/dashboard/analysis"
            element={
              <Layout>
                <Analysis />
              </Layout>
            }
        />

        <Route
          path="/dashboard/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />

        <Route
  path="/dashboard/history"
  element={
    <Layout>
      <History />
    </Layout>
  }
/>

        <Route
          path="/dashboard/settings"
          element={
            <Layout>
              <div
                style={{
                  color: "white",
                  padding: "40px",
                }}
              >
                <h1>Settings</h1>
                <p>
                  Configure your application here.
                </p>
              </div>
            </Layout>
          }
        />

        <Route
          path="/dashboard/help"
          element={
            <Layout>
              <div
                style={{
                  color: "white",
                  padding: "40px",
                }}
              >
                <h1>Help</h1>
                <p>
                  User guide and documentation will appear here.
                </p>
              </div>
            </Layout>
          }
        />

        {/* ================= 404 ================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;