import { useEffect, useState } from "react";

import {
  User,
  Mail,
  Shield,
  Activity,
  Weight,
  Ruler,
  Trophy,
  Edit,
  ArrowLeft,
  Upload,
  History,
} from "lucide-react";

import { Link } from "react-router-dom";

import api from "../services/api";

export default function Profile() {

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
  total_uploads: 0,
  total_analysis: 0,
  current_risk: "-",
  accuracy: "98%",
});
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
  age: "",
  gender: "",
  height: "",
  weight: "",
  sport: "",
  experience: "",
  position: "",
});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      // Logged-in user
      const authRes = await api.get(
        "/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser({
        ...authRes.data.user,
        username: localStorage.getItem("username"),
        email: authRes.data.user.sub,
        });

      // Athlete profile
      const profileRes = await api.get(
        "/athlete/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(profileRes.data);
      const dashboardRes = await api.get(
  "/video/dashboard",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

setStats(dashboardRes.data);
      setFormData({
  age: profileRes.data.age,
  gender: profileRes.data.gender,
  height: profileRes.data.height,
  weight: profileRes.data.weight,
  sport: profileRes.data.sport,
  experience: profileRes.data.experience,
  position: profileRes.data.position,
});

    }
    catch (err) {

      console.log(err);

    }
    finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (

      <div className="min-h-screen bg-[#050816] flex justify-center items-center text-white text-2xl">

        Loading Profile...

      </div>

    );

  }
  const handleChange = (e) => {

  setFormData({

    ...formData,

    [e.target.name]: e.target.value,

  });

};

const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const token = localStorage.getItem("token");

    await api.put(

      "/athlete/profile",

      formData,

      {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      }

    );

    alert("Profile Updated Successfully");

    setEditing(false);

    loadProfile();

  } catch (err) {

    console.log(err);

    alert("Unable to update profile.");

  }

};

  return (

    <div className="min-h-screen bg-[#050816] text-white">

      {/* Navbar */}

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

            Athlete Profile

          </h1>

        </div>

        <div className="flex gap-4">

          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <Upload size={20} />
            Upload
          </Link>

          <Link
            to="/history"
            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <History size={20} />
            History
          </Link>

        </div>

      </nav>

      <div className="max-w-7xl mx-auto px-8 py-10">

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Card */}

          <div className="bg-white/5 rounded-3xl border border-white/10 p-8">

            <div className="flex justify-center">

              <div className="w-36 h-36 rounded-full bg-blue-600 flex items-center justify-center text-5xl font-bold">

                {user?.username
                  ? user.username.charAt(0).toUpperCase()
                  : "A"}

              </div>

            </div>

            <h2 className="text-3xl font-bold text-center mt-6">

              {user?.username}

            </h2>

            <p className="text-center text-gray-400 mt-2">

              {user?.role}

            </p>

            <Link to="/edit-profile">

  <button className="mt-8 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl flex justify-center items-center gap-3">

    <Edit size={20} />

    Edit Profile

  </button>

</Link>

          </div>

          {/* Right Section */}

          <div className="lg:col-span-2 bg-white/5 rounded-3xl border border-white/10 p-8">

            <h2 className="text-2xl font-bold mb-8">

              Personal Information

            </h2>

            <form
  onSubmit={handleSubmit}
  className="grid md:grid-cols-2 gap-6"
>

  <div>
    <label className="text-gray-400">Age</label>

    <input
      type="number"
      name="age"
      value={formData.age}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div>
    <label className="text-gray-400">Gender</label>

    <input
      type="text"
      name="gender"
      value={formData.gender}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div>
    <label className="text-gray-400">Height (cm)</label>

    <input
      type="number"
      name="height"
      value={formData.height}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div>
    <label className="text-gray-400">Weight (kg)</label>

    <input
      type="number"
      name="weight"
      value={formData.weight}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div>
    <label className="text-gray-400">Sport</label>

    <input
      type="text"
      name="sport"
      value={formData.sport}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div>
    <label className="text-gray-400">Experience</label>

    <input
      type="number"
      step="0.5"
      name="experience"
      value={formData.experience}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div className="md:col-span-2">
    <label className="text-gray-400">Playing Position</label>

    <input
      type="text"
      name="position"
      value={formData.position}
      disabled={!editing}
      onChange={handleChange}
      className="w-full mt-2 bg-[#0f172a] border border-white/10 rounded-xl p-3"
    />
  </div>

  <div className="md:col-span-2 flex gap-4 mt-4">

    {!editing ? (

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
      >
        Edit Profile
      </button>

    ) : (

      <>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
        >
          Save Changes
        </button>

        <button
          type="button"
          onClick={() => {
            setEditing(false);
            loadProfile();
          }}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl"
        >
          Cancel
        </button>
      </>

    )}

  </div>

</form>

</div>

</div>

{/* Statistics */}

<div className="mt-10 bg-white/5 rounded-3xl border border-white/10 p-8">

  <h2 className="text-2xl font-bold mb-8">

    Athlete Statistics

  </h2>

  <div className="grid md:grid-cols-4 gap-6">

    <StatCard
  title="Videos Uploaded"
  value={stats.total_uploads}
/>

<StatCard
  title="AI Analyses"
  value={stats.total_analysis}
/>

<StatCard
  title="Risk Level"
  value={stats.current_risk}
/>

<StatCard
  title="Success Rate"
  value={stats.accuracy}
/>

  </div>

</div>

</div>

</div>
    );

}
function InfoCard({ icon, title, value }) {

  return (

    <div className="bg-[#0f172a] rounded-2xl p-6 border border-white/10 hover:border-blue-500 transition-all">

      <div className="flex items-center gap-3 text-blue-400">

        {icon}

        <span className="font-semibold">

          {title}

        </span>

      </div>

      <h3 className="mt-5 text-xl font-bold break-words">

        {value || "-"}

      </h3>

    </div>

  );

}

function StatCard({ title, value }) {

  return (

    <div className="bg-[#0f172a] rounded-2xl p-6 border border-white/10 hover:border-green-500 transition-all text-center">

      <h3 className="text-gray-400 text-lg">

        {title}

      </h3>

      <p className="text-4xl font-bold text-green-400 mt-5">

        {value}

      </p>

    </div>

  );

}