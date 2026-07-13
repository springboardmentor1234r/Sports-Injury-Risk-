import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";

export default function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "athlete",
    });

    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] =useState(false);

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (form.password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {

            setLoading(true);

            await api.post("/auth/register", form);

            alert("Registration Successful!");

            navigate("/login");

        } catch (err) {

            console.log(err);

            alert("Registration Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-[#050816] flex justify-center items-center px-6">

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10">

                <h1 className="text-4xl font-bold text-white text-center">

                    Create Account

                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 mt-8"
                >

                    <input
                        name="username"
                        placeholder="Username"
                        required
                        value={form.username}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-[#10192b] text-white"
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-[#10192b] text-white"
                    />

                    <div className="relative">

                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            className="w-full p-4 rounded-xl bg-[#10192b] text-white"
                        />

                        <button
                            type="button"
                            onClick={()=>setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-gray-400"
                        >

                            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}

                        </button>

                    </div>

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        required
                        value={confirmPassword}
                        onChange={(e)=>setConfirmPassword(e.target.value)}
                        className="w-full p-4 rounded-xl bg-[#10192b] text-white"
                    />

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full p-4 rounded-xl bg-[#10192b] text-white"
                    >
                        <option value="athlete">Athlete</option>
                        <option value="coach">Coach</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 text-white font-semibold"
                    >
                        {loading ? "Creating..." : "Register"}
                    </button>

                </form>

                <p className="text-center text-gray-400 mt-6">

                    Already have an account?

                    <Link
                        to="/login"
                        className="text-blue-400 ml-2"
                    >
                        Login
                    </Link>

                </p>

            </div>

        </div>

    );

}