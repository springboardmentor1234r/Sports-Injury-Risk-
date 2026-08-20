import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";

import {
    FaRunning,
    FaShieldAlt,
    FaFilePdf,
    FaBullseye,
    FaVideo,
    FaHeartbeat,
    FaChartBar,
    FaGoogle,
    FaArrowRight,
} from "react-icons/fa";

import api from "../services/api";

import runnerImage from "../assets/images/runner.png";

import "../styles/Home.css";


function Home() {

    const navigate = useNavigate();


    // ================= LOGIN STATE =================

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("athlete");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);


    // ================= LOGIN =================

    const handleLogin = async (e) => {

        e.preventDefault();

        if (!email || !password) {

            alert("Please enter your email and password.");

            return;

        }

        try {

            setLoading(true);

            const response = await api.post("/login", {

                email,
                password,
                role,

            });


            alert(response.data.message);


            // Save logged-in user

            localStorage.setItem(

                "user",

                JSON.stringify({

                    name: response.data.name,

                    email: response.data.email,

                    role: response.data.role,

                })

            );


            // Remember email if selected

            if (rememberMe) {

                localStorage.setItem(
                    "rememberedEmail",
                    email
                );

            } else {

                localStorage.removeItem(
                    "rememberedEmail"
                );

            }


            // ==================================================
            // ROLE-BASED DASHBOARD REDIRECTION
            // ==================================================

            if (response.data.role === "admin") {

                navigate("/dashboard/admin-home");

            }

            else if (response.data.role === "coach") {

                navigate("/dashboard/coach-home");

            }

            else {

                navigate("/dashboard/athlete-home");

            }


        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );


            if (error.response) {

                alert(

                    error.response.data?.detail ||

                    "Invalid email, password, or role."

                );

            }

            else {

                alert(

                    "Unable to connect to the server. Please make sure the backend is running."

                );

            }

        }

        finally {

            setLoading(false);

        }

    };


   // ================= GOOGLE LOGIN =================
   // ================= GOOGLE LOGIN =================

const handleGoogleLogin = useGoogleLogin({

    onSuccess: async (tokenResponse) => {

        try {

            console.log(
                "Google OAuth successful."
            );


            // --------------------------------------------------
            // Get Google user information
            // --------------------------------------------------

            const response = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                    headers: {
                        Authorization:
                            `Bearer ${tokenResponse.access_token}`
                    }
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Unable to get Google user information."
                );

            }


            const googleUser =
                await response.json();


            console.log(
                "Google User:",
                googleUser
            );


            if (!googleUser.email) {

                throw new Error(
                    "Google account email not available."
                );

            }


            // --------------------------------------------------
            // Ask backend for the user's actual role
            // --------------------------------------------------

            const backendResponse = await api.post(
                "/google-login",
                {
                    credential:
                        tokenResponse.access_token
                }
            );


            console.log(
                "Backend Google Response:",
                backendResponse.data
            );


            const loggedInUser =
                backendResponse.data;


            // --------------------------------------------------
            // Save actual user information
            // --------------------------------------------------

            localStorage.setItem(
                "user",
                JSON.stringify({

                    name:
                        loggedInUser.name ||
                        googleUser.name,

                    email:
                        loggedInUser.email ||
                        googleUser.email,

                    role:
                        loggedInUser.role ||
                        "athlete",

                    picture:
                        googleUser.picture || "",

                    googleLogin: true

                })
            );


            alert(
                `Welcome ${loggedInUser.name || googleUser.name}!`
            );


            // --------------------------------------------------
            // ROLE BASED REDIRECTION
            // --------------------------------------------------

            if (
                loggedInUser.role === "admin"
            ) {

                navigate(
                    "/dashboard/admin-home"
                );

            }

            else if (
                loggedInUser.role === "coach"
            ) {

                navigate(
                    "/dashboard/coach-home"
                );

            }

            else {

                navigate(
                    "/dashboard/athlete-home"
                );

            }


        }

        catch (error) {

            console.error(
                "Google Login Error:",
                error
            );


            alert(
                "Google login failed. Please try again."
            );

        }

    },


    onError: (error) => {

        console.error(
            "Google OAuth Error:",
            error
        );


        alert(
            "Google Login failed. Please try again."
        );

    }

});


    return (

        <div className="home">


            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <nav className="landing-navbar">

                <div className="landing-logo">

                    <img
                        src={require("../assets/images/logo.png")}
                        alt="Sports Injury Logo"
                    />

                    <div>

                        <h2>
                            Sports Injury
                        </h2>

                        <p>
                            Risk Detection
                        </p>

                    </div>

                </div>


                <div className="landing-links">

                    <a href="#features">
                        Features
                    </a>

                    <a href="#about">
                        About
                    </a>

                    <a href="#contact">
                        Contact
                    </a>

                </div>


                <div className="landing-buttons">

                    <Link to="/login">

                        <button className="nav-login">

                            Login

                        </button>

                    </Link>


                    <Link to="/register">

                        <button className="nav-register">

                            Register

                        </button>

                    </Link>

                </div>

            </nav>


            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="hero">


                {/* ================= LEFT ================= */}

                <div className="hero-left">

                    <div className="hero-badge">

                        ✦ AI Powered • Smart • Accurate

                    </div>


                    <h1>

                        Prevent Injuries.

                        <br />

                        Elevate
                        <span>
                            Performance.
                        </span>

                    </h1>


                    <TypeAnimation

                        sequence={[

                            "Analyse Athlete Movement.",
                            1800,

                            "Predict Injury Risk.",
                            1800,

                            "Improve Performance.",
                            1800,

                            "Prevent Injuries.",
                            1800,

                        ]}

                        wrapper="h2"

                        speed={45}

                        repeat={Infinity}

                        className="typing-text"

                    />


                    <p>

                        AI-powered athlete performance analysis using
                        computer vision, pose estimation, joint angle
                        analysis and injury prediction. Make data-driven
                        decisions for a safer and stronger future.

                    </p>


                    <div className="hero-tags">

                        <span>

                            <FaRunning />

                            Pose Detection

                        </span>


                        <span>

                            <FaShieldAlt />

                            Injury Prediction

                        </span>


                        <span>

                            <FaFilePdf />

                            Smart Reports

                        </span>

                    </div>

                </div>


                {/* ================= CENTER / IMAGE ================= */}

                <div className="hero-center">

                    <div className="hero-glow"></div>

                    <img

                        src={runnerImage}

                        alt="AI Athlete Analysis"

                        className="hero-runner"

                    />

                </div>


                {/* =====================================================
                    LOGIN CARD
                ===================================================== */}

                <div className="hero-login-card">

                    <div className="login-card-glow"></div>


                    <h2>

                        Welcome Back 👋

                    </h2>


                    <p className="login-subtitle">

                        Sign in to continue your journey

                    </p>


                    {/* ================= LOGIN FORM ================= */}

                    <form onSubmit={handleLogin}>


                        {/* ================= EMAIL ================= */}

                        <div className="login-input">

                            <span>
                                ✉
                            </span>


                            <input

                                type="email"

                                placeholder="Enter your email"

                                value={email}

                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }

                                required

                            />

                        </div>


                        {/* ================= PASSWORD ================= */}

                        <div className="login-input">

                            <span>
                                🔒
                            </span>


                            <input

                                type="password"

                                placeholder="Enter your password"

                                value={password}

                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }

                                required

                            />


                            <span className="password-eye">

                                ◉

                            </span>

                        </div>


                        {/* ================= ROLE ================= */}

                        <select

                            className="login-role"

                            value={role}

                            onChange={(e) =>
                                setRole(e.target.value)
                            }

                            required

                        >

                            <option value="athlete">

                                Athlete

                            </option>


                            <option value="coach">

                                Coach

                            </option>


                            <option value="admin">

                                Admin

                            </option>

                        </select>


                        {/* ================= REMEMBER ================= */}

                        <div className="login-options">

                            <label>

                                <input

                                    type="checkbox"

                                    checked={rememberMe}

                                    onChange={(e) =>
                                        setRememberMe(
                                            e.target.checked
                                        )
                                    }

                                />

                                <span>

                                    Remember me

                                </span>

                            </label>


                            <Link to="/forgot-password">

                                Forgot password?

                            </Link>

                        </div>


                        {/* ================= LOGIN BUTTON ================= */}

                        <button

                            type="submit"

                            className="hero-login-btn"

                            disabled={loading}

                        >

                            {loading

                                ? "Signing In..."

                                : "Log In"

                            }

                        </button>

                    </form>


                    {/* ================= DIVIDER ================= */}

                    <div className="login-divider">

                        <span></span>

                        <p>
                            or
                        </p>

                        <span></span>

                    </div>


                    {/* ================= GOOGLE ================= */}

                    <button

                        className="google-login-btn"

                        type="button"

                        onClick={handleGoogleLogin}

                    >

                        <FaGoogle />

                        <span>

                            Continue with Google

                        </span>

                    </button>


                    {/* ================= REGISTER ================= */}

                    <p className="signup-text">

                        Don't have an account?

                        <Link to="/register">

                            Sign up

                        </Link>

                    </p>

                </div>

            </section>




            {/* =====================================================
                FEATURES
            ===================================================== */}

            <section

                className="trust-section"

                id="features"

            >

                <div className="section-title">

                    <h2>

                        Why Coaches & Athletes Trust Us

                    </h2>

                    <span></span>

                </div>


                <div className="trust-grid">


                    <div className="trust-card">

                        <FaBullseye />

                        <div>

                            <h3>

                                Accurate Analysis

                            </h3>

                            <p>

                                Advanced AI models provide highly
                                accurate movement and injury risk analysis.

                            </p>

                        </div>

                    </div>


                    <div className="trust-card">

                        <FaVideo />

                        <div>

                            <h3>

                                Real-time Processing

                            </h3>

                            <p>

                                Get instant insights with real-time
                                pose detection and analysis.

                            </p>

                        </div>

                    </div>


                    <div className="trust-card">

                        <FaHeartbeat />

                        <div>

                            <h3>

                                Injury Prevention

                            </h3>

                            <p>

                                Identify potential risks early and
                                take preventive actions to stay injury-free.

                            </p>

                        </div>

                    </div>


                    <div className="trust-card">

                        <FaChartBar />

                        <div>

                            <h3>

                                Data-Driven Insights

                            </h3>

                            <p>

                                Make smarter decisions with comprehensive
                                reports and performance metrics.

                            </p>

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="cta-section">

                <h2>

                    Ready to Analyse Athlete Performance?

                </h2>


                <p>

                    Join coaches and athletes using AI to improve
                    performance and reduce injuries.

                </p>


                <Link to="/register">

                    <button className="cta-btn">

                        Get Started

                        <FaArrowRight />

                    </button>

                </Link>

            </section>


            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer

                className="landing-footer"

                id="contact"

            >

                <div>

                    <strong>

                        Sports Injury Risk Detection

                    </strong>


                    <p>

                        AI-powered athlete movement analysis.

                    </p>

                </div>


                <div>

                    <p>

                        Infosys Springboard Internship Project

                    </p>


                    <p>

                        © 2026 Sports Injury Risk Detection

                    </p>

                </div>

            </footer>

        </div>

    );

}


export default Home;