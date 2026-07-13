import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const response = await api.post("/auth/login", {
                email: email,
                password: password,
            });

            localStorage.setItem(
                "token",
                response.data.access_token
            );

            alert("Login Successful!");

            navigate("/dashboard");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Invalid Email or Password"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#050816] px-6">

            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">

                <h1 className="text-4xl font-bold text-white text-center">
                    Welcome Back
                </h1>

                <p className="text-gray-400 text-center mt-3">
                    Login to SportSense AI
                </p>

                <form
                    onSubmit={handleLogin}
                    className="mt-8 space-y-6"
                >

                    <div>

                        <label className="text-gray-300">
                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-2 p-4 rounded-xl bg-[#10192b] text-white border border-gray-700 focus:border-blue-500 outline-none"
                        />

                    </div>

                    <div>

                        <label className="text-gray-300">
                            Password
                        </label>

                        <div className="relative mt-2">

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-[#10192b] text-white border border-gray-700 focus:border-blue-500 outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-gray-400"
                            >
                                {
                                    showPassword
                                        ? <EyeOff size={20} />
                                        : <Eye size={20} />
                                }
                            </button>

                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-4 text-white font-semibold"
                    >
                        {
                            loading
                                ? "Logging in..."
                                : "Login"
                        }
                    </button>

                </form>

                <p className="text-center text-gray-400 mt-8">

                    Don't have an account?

                    <Link
                        to="/register"
                        className="text-blue-400 ml-2 hover:underline"
                    >
                        Register
                    </Link>

                </p>

            </div>

        </div>

    );

}