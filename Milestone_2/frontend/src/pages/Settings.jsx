import {
  ArrowLeft,
  LogOut,
  Lock,
  Trash2,
  Info,
  User,
  Moon,
  Bell,
} from "lucide-react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Settings() {

  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Athlete";

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");

  };

  const deleteAccount = async () => {

  const ok = window.confirm(
    "Are you sure?\n\nThis will permanently delete your account, profile, uploaded videos and reports."
  );

  if (!ok) return;

  try {

    const token = localStorage.getItem("token");

    await api.delete(
      "/auth/delete-account",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Account deleted successfully.");

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");

  } catch (err) {

  console.error("DELETE ERROR:", err);
  console.log("Response:", err.response);

  alert(
    JSON.stringify(err.response?.data) ||
    "Failed to delete account."
  );

}

};
    return (

    <div className="min-h-screen bg-[#050816] text-white">

      <nav className="h-20 border-b border-white/10 flex justify-between items-center px-10">

        <div className="flex items-center gap-5">

          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            <ArrowLeft size={20} />
            Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-blue-500">

            Settings

          </h1>

        </div>

      </nav>

      <div className="max-w-5xl mx-auto py-10 px-8">

        <div className="grid gap-6">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <div className="flex items-center gap-3">

              <User className="text-blue-400" />

              <h2 className="text-2xl font-bold">

                Account

              </h2>

            </div>

            <p className="mt-5 text-lg">

              Username:
              <span className="ml-3 text-blue-400">

                {username}

              </span>

            </p>

          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

  <Link
    to="/profile"
    className="w-full flex justify-between items-center"
  >

    <div className="flex items-center gap-3">

      <User className="text-blue-400" />

      <span className="text-xl">

        Edit Athlete Profile

      </span>

    </div>

    <span>→</span>

  </Link>

</div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <button className="w-full flex justify-between items-center">

              <div className="flex items-center gap-3">

                <Lock className="text-green-400" />

                <span className="text-xl">

                  Change Password (Coming Soon)

                </span>

              </div>

              <span>

                →

              </span>

            </button>

          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

  <div className="flex justify-between items-center">

    <div className="flex items-center gap-3">

      <Moon className="text-purple-400" />

      <div>

        <h2 className="text-xl font-semibold">

          Dark Theme

        </h2>

        <p className="text-gray-400">

          Currently Enabled

        </p>

      </div>

    </div>

  </div>

</div>
<div className="bg-white/5 border border-white/10 rounded-2xl p-6">

  <div className="flex justify-between items-center">

    <div className="flex items-center gap-3">

      <Bell className="text-yellow-400" />

      <div>

        <h2 className="text-xl font-semibold">

          Notifications

        </h2>

        <p className="text-gray-400">

          Coming Soon

        </p>

      </div>

    </div>

  </div>

</div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <button
              onClick={logout}
              className="w-full flex justify-between items-center"
            >

              <div className="flex items-center gap-3">

                <LogOut className="text-yellow-400" />

                <span className="text-xl">

                  Logout

                </span>

              </div>

              <span>

                →

              </span>

            </button>

          </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <button
              onClick={deleteAccount}
              className="w-full flex justify-between items-center"
            >

              <div className="flex items-center gap-3">

                <Trash2 className="text-red-400" />

                <span className="text-xl">

                  Delete Account

                </span>

              </div>

              <span>→</span>

            </button>

          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-4">

              <Info className="text-cyan-400" />

              <h2 className="text-2xl font-bold">

                About SportSense AI

              </h2>

            </div>

            <p className="text-gray-300 leading-8">

              SportSense AI is an AI-powered Sports Injury Risk Detection Platform
              that analyzes athlete movement videos using Computer Vision,
              MediaPipe Pose Estimation, Biomechanics Analysis and Machine
              Learning to identify injury risks before they occur.

            </p>

            <p className="text-gray-500 mt-6">

  Version 2.0 (Milestone 2)

</p>

          </div>

        </div>

      </div>

    </div>

  );

}