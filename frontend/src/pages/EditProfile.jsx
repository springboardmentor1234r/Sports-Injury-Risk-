import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function EditProfile() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
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

      const res = await api.get("/athlete/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setForm(res.data);

    } catch (err) {

      console.log(err);
      alert("Unable to load profile.");

    } finally {

      setLoading(false);

    }

  };
    const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setSaving(true);

      const token = localStorage.getItem("token");

      await api.put(
        "/athlete/profile",
        {
          age: Number(form.age),
          gender: form.gender,
          height: Number(form.height),
          weight: Number(form.weight),
          sport: form.sport,
          experience: Number(form.experience),
          position: form.position,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Profile updated successfully.");

      navigate("/profile");

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Unable to update profile."
      );

    } finally {

      setSaving(false);

    }

  };

  if (loading) {

    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white text-2xl">
        Loading...
      </div>
    );

  }

  return (

    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-3xl p-10">

        <h1 className="text-4xl font-bold mb-8 text-center">
          Edit Athlete Profile
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-6"
        >
                  <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            type="number"
            name="height"
            placeholder="Height (cm)"
            value={form.height}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          />

          <input
            type="number"
            name="weight"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          />

          <input
            type="text"
            name="sport"
            placeholder="Sport"
            value={form.sport}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          />

          <input
            type="number"
            step="0.1"
            name="experience"
            placeholder="Experience (Years)"
            value={form.experience}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
            required
          />

          <input
            type="text"
            name="position"
            placeholder="Playing Position"
            value={form.position}
            onChange={handleChange}
            className="p-4 rounded-xl bg-[#0f172a] border border-white/10 outline-none md:col-span-2"
          />

          <div className="md:col-span-2 flex justify-end gap-4 mt-4">

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}