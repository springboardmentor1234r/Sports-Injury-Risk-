import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";

import {
  FaGoogle,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import api from "../services/api";
import "../styles/Login.css";


function Login() {

  const navigate = useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("athlete");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // =========================================================
  // NORMAL LOGIN
  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const response = await api.post("/login", {
        email,
        password,
        role,
      });


      // -----------------------------------------------------
      // Save the user returned by backend
      // -----------------------------------------------------

      const userData = {
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );


      console.log(
        "Normal login user:",
        userData
      );


      alert(response.data.message);


      // -----------------------------------------------------
      // Redirect based on BACKEND role
      // -----------------------------------------------------

      if (response.data.role === "admin") {

        navigate("/dashboard/admin-home");

      } else if (response.data.role === "coach") {

        navigate("/dashboard/coach-home");

      } else {

        navigate("/dashboard/athlete-home");

      }

    } catch (error) {

      console.error(
        "Normal login error:",
        error
      );


      if (error.response) {

        alert(
          error.response.data.detail ||
          "Invalid email, password, or role."
        );

      } else {

        alert(
          "Something went wrong. Please try again."
        );

      }
    }
  };


  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  const googleLogin = useGoogleLogin({

    onSuccess: async (tokenResponse) => {

      try {

        // ===================================================
        // STEP 1 — REMOVE OLD LOGIN
        // ===================================================

        // This prevents an old Athlete/Coach account from
        // remaining in localStorage.

        localStorage.removeItem("user");


        // ===================================================
        // STEP 2 — GET GOOGLE USER INFORMATION
        // ===================================================

        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization:
                `Bearer ${tokenResponse.access_token}`,
            },
          }
        );


        if (!response.ok) {

          throw new Error(
            "Unable to get Google user information."
          );

        }


        const googleUser = await response.json();


        console.log(
          "Google User:",
          googleUser
        );


        // ===================================================
        // STEP 3 — SEND GOOGLE USER TO BACKEND
        // ===================================================

        // IMPORTANT:
        // The backend is responsible for deciding the role.
        //
        // For example:
        //
        // sejalchintala11@gmail.com
        //             ↓
        //          ADMIN
        //
        // The selected dropdown role should NOT override
        // the backend's decision.

        const backendResponse = await api.post(
          "/google-login",
          {
            email: googleUser.email,
            name: googleUser.name,
            role: role,
          }
        );


        console.log(
          "Google backend response:",
          backendResponse.data
        );


        // ===================================================
        // STEP 4 — GET CONFIRMED USER DATA
        // ===================================================

        const userRole =
          backendResponse.data.role
            ?.toLowerCase();

        const confirmedName =
          backendResponse.data.name ||
          googleUser.name;

        const confirmedEmail =
          backendResponse.data.email ||
          googleUser.email;


        // ===================================================
        // SAFETY CHECK
        // ===================================================

        if (!userRole) {

          throw new Error(
            "Backend did not return a user role."
          );

        }


        console.log(
          "Backend-assigned role:",
          userRole
        );


        // ===================================================
        // STEP 5 — SAVE USER
        // ===================================================

        const userData = {

          name: confirmedName,

          email: confirmedEmail,

          role: userRole,

          picture: googleUser.picture,

          googleLogin: true,

        };


        localStorage.setItem(
          "user",
          JSON.stringify(userData)
        );


        console.log(
          "Saved user:",
          JSON.parse(
            localStorage.getItem("user")
          )
        );


        // ===================================================
        // STEP 6 — SUCCESS MESSAGE
        // ===================================================

        alert(
          `Welcome ${confirmedName}!`
        );


        // ===================================================
        // STEP 7 — REDIRECT BASED ON BACKEND ROLE
        // ===================================================

        if (userRole === "admin") {

          console.log(
            "Redirecting to ADMIN dashboard..."
          );

          navigate(
            "/dashboard/admin-home"
          );

        } else if (userRole === "coach") {

          console.log(
            "Redirecting to COACH dashboard..."
          );

          navigate(
            "/dashboard/coach-home"
          );

        } else {

          console.log(
            "Redirecting to ATHLETE dashboard..."
          );

          navigate(
            "/dashboard/athlete-home"
          );

        }

      } catch (error) {

        console.error(
          "Google login error:",
          error
        );


        alert(
          "Google login succeeded, but we could not verify your account with the server."
        );

      }
    },


    // =======================================================
    // GOOGLE LOGIN ERROR
    // =======================================================

    onError: () => {

      console.error(
        "Google Login failed."
      );

      alert(
        "Google Login failed. Please try again."
      );

    },

  });


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="login-page">

      <div className="login-background-glow"></div>


      <div className="login-card">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="login-header">

          <h1>
            Welcome Back 👋
          </h1>

          <p>
            Sign in to continue your journey
          </p>

        </div>


        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>


          {/* EMAIL */}

          <div className="login-input">

            <FaEnvelope />

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


          {/* PASSWORD */}

          <div className="login-input">

            <FaLock />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />


            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >

              {showPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}

            </button>

          </div>


          {/* ROLE */}

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


          {/* OPTIONS */}

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


            <button
              type="button"
              className="forgot-password"
            >
              Forgot password?
            </button>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-submit"
          >
            Log In
          </button>

        </form>


        {/* =================================================
            DIVIDER
        ================================================= */}

        <div className="login-divider">

          <span></span>

          <p>
            or
          </p>

          <span></span>

        </div>


        {/* =================================================
            GOOGLE LOGIN
        ================================================= */}

        <button
          type="button"
          className="google-login"
          onClick={() => {

            // Clear previous account before Google login
            localStorage.removeItem("user");

            googleLogin();

          }}
        >

          <FaGoogle />

          <span>
            Continue with Google
          </span>

        </button>


        {/* =================================================
            REGISTER
        ================================================= */}

        <div className="login-signup">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Sign up
          </button>

        </div>


      </div>

    </div>

  );

}


export default Login;