import {
  Upload,
  Activity,
  ShieldCheck,
  FileBarChart,
  PlayCircle,
  User,
  LogOut,
  History,
  Home,
  Settings,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {

  const navigate = useNavigate();

  const username =
    localStorage.getItem("username") || "Athlete";

  const [stats, setStats] = useState({
    videos: 0,
    analyses: 0,
    risk: "--",
    accuracy: "--",
  });

  const [recentVideos, setRecentVideos] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {

    try {

      const token = localStorage.getItem("token");

      const dashboardRes = await api.get(
        "/video/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats({
        videos: dashboardRes.data.total_uploads,
        analyses: dashboardRes.data.total_analysis,
        risk: dashboardRes.data.current_risk,
        accuracy: dashboardRes.data.accuracy,
      });

      const historyRes = await api.get(
        "/video/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRecentVideos(historyRes.data.slice(0, 5));

    } catch (err) {

      console.log(err);

    }

  };

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");

  };

  return (

    <div className="min-h-screen bg-[#050816] text-white flex">
            {/* ================= Sidebar ================= */}

      <aside className="w-72 bg-[#0b1220] border-r border-white/10 flex flex-col">

        <div className="p-8 border-b border-white/10">

          <h1 className="text-3xl font-bold text-blue-500">
            SportSense AI
          </h1>

        </div>

        <div className="flex-1 p-6 space-y-3">

          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-600"
          >
            <Home size={20} />
            Dashboard
          </Link>

          <Link
            to="/upload"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-blue-600 transition"
          >
            <Upload size={20} />
            Upload Video
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-blue-600 transition"
          >
            <History size={20} />
            Upload History
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-blue-600 transition"
          >
            <User size={20} />
            Profile
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-blue-600 transition"
          >
            <Settings size={20} />
            Settings
          </Link>

        </div>

        <div className="p-6 border-t border-white/10">

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold"
          >
            <LogOut size={20} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================= Main ================= */}

      <main className="flex-1">

        {/* Top Bar */}

        <div className="flex justify-between items-center border-b border-white/10 px-10 h-20">

          <div>

            <h2 className="text-3xl font-bold">
              Welcome {username} 👋
            </h2>

            <p className="text-gray-400">
              AI Powered Sports Injury Detection Platform
            </p>

          </div>

          <Link to="/profile">

            <div className="flex items-center gap-4 cursor-pointer">

              <div className="text-right">

                <p className="font-semibold">
                  {username}
                </p>

                <p className="text-sm text-gray-400">
                  Athlete
                </p>

              </div>

              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">

                {username.charAt(0).toUpperCase()}

              </div>

            </div>

          </Link>

        </div>

        {/* Dashboard Content */}

        <div className="p-10">

          {/* Dashboard Cards */}

          <div className="grid md:grid-cols-4 gap-6">

            <Card
              icon={<Upload size={32} />}
              title="Videos Uploaded"
              value={stats.videos}
            />

            <Card
              icon={<Activity size={32} />}
              title="AI Analyses"
              value={stats.analyses}
            />

            <Card
              icon={<ShieldCheck size={32} />}
              title="Current Risk"
              value={stats.risk}
            />

            <Card
              icon={<FileBarChart size={32} />}
              title="Accuracy"
              value={stats.accuracy}
            />

          </div>
                    {/* ================= Upload Banner ================= */}

          <div className="mt-12 bg-gradient-to-r from-blue-700 to-cyan-600 rounded-3xl p-10 flex justify-between items-center">

            <div>

              <h2 className="text-3xl font-bold">
                Analyze a New Video
              </h2>

              <p className="mt-3 text-blue-100">

                Upload your sports movement video and receive AI-powered
                biomechanical analysis, pose estimation and injury prediction.

              </p>

            </div>

            <Link to="/upload">

              <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-100 transition">

                <PlayCircle size={24} />

                Upload Now

              </button>

            </Link>

          </div>

          {/* ================= Recent Uploads ================= */}

          <div className="mt-12 bg-white/5 rounded-3xl border border-white/10 p-8">

            <div className="flex justify-between items-center mb-8">

              <h2 className="text-2xl font-bold">
                Recent Uploads
              </h2>

              <Link
                to="/history"
                className="text-blue-400 hover:underline"
              >
                View All
              </Link>

            </div>

            <table className="w-full">

              <thead>

                <tr className="text-left text-gray-400">

                  <th className="pb-4">Video Name</th>

                  <th className="pb-4">Uploaded On</th>

                  <th className="pb-4">Status</th>

                </tr>

              </thead>

              <tbody>

                {recentVideos.length > 0 ? (

                  recentVideos.map((video) => (

                    <Row
                      key={video.id}
                      video={video.filename}
                      date={new Date(video.uploaded_at).toLocaleDateString()}
                      status="Completed"
                    />

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="3"
                      className="text-center py-8 text-gray-400"
                    >

                      No uploaded videos found.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>

  );

}
/* ================= Dashboard Card ================= */

function Card({ icon, title, value }) {

  return (

    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500 transition">

      <div className="text-blue-400">

        {icon}

      </div>

      <h3 className="text-gray-400 mt-5">

        {title}

      </h3>

      <h2 className="text-4xl font-bold mt-3">

        {value}

      </h2>

    </div>

  );

}

/* ================= Recent Upload Row ================= */

function Row({ video, date, status }) {

  return (

    <tr className="border-t border-white/10 h-16">

      <td className="py-4">

        {video}

      </td>

      <td>

        {date}

      </td>

      <td>

        <span
          className={`px-4 py-1 rounded-full ${
            status === "Completed"
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >

          {status}

        </span>

      </td>

    </tr>

  );

}