import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Settings.css";

function Settings() {

  const navigate = useNavigate();

  const [theme, setTheme] =
    useState("Dark");


  const user =
    JSON.parse(
      localStorage.getItem("user")
    );


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {

    // Remove logged-in user
    localStorage.removeItem("user");

    // Remove any saved analysis if needed
    localStorage.removeItem("analysis");

    // Go to landing page
    navigate("/");

  };


  return (

    <div className="settings-page">


      {/* HEADER */}

      <div className="settings-header">

        <h1>
          Settings
        </h1>

        <p>
          Manage your account and application preferences.
        </p>

      </div>


      {/* PROFILE */}

      <div className="settings-card">

        <h2>
          Profile Information
        </h2>


        <div className="setting-item">

          <span>
            Name
          </span>

          <strong>
            {user?.name ||
              "Guest User"}
          </strong>

        </div>


        <div className="setting-item">

          <span>
            Email
          </span>

          <strong>
            {user?.email ||
              "Not Available"}
          </strong>

        </div>


        <div className="setting-item">

          <span>
            Role
          </span>

          <strong>

            {user?.role

              ? user.role
                  .charAt(0)
                  .toUpperCase() +
                user.role.slice(1)

              : "Guest"}

          </strong>

        </div>

      </div>


      {/* APPEARANCE */}

      <div className="settings-card">

        <h2>
          Appearance
        </h2>


        <div className="setting-item">

          <span>
            Theme
          </span>


          <select

            value={theme}

            onChange={(e) =>
              setTheme(
                e.target.value
              )
            }

          >

            <option>
              Dark
            </option>

            <option disabled>
              Light (Coming Soon)
            </option>

          </select>

        </div>

      </div>


      {/* SECURITY */}

      <div className="settings-card">

        <h2>
          Security
        </h2>


        <button
          className="settings-btn"
          type="button"
        >

          Change Password

        </button>


        <button

          className="settings-btn logout-btn"

          type="button"

          onClick={
            handleLogout
          }

        >

          Logout

        </button>

      </div>


      {/* ABOUT */}

      <div className="settings-card">

        <h2>
          About
        </h2>


        <div className="setting-item">

          <span>
            Application
          </span>

          <strong>
            Sports Injury Risk Detection
          </strong>

        </div>


        <div className="setting-item">

          <span>
            Version
          </span>

          <strong>
            3.0
          </strong>

        </div>


        <div className="setting-item">

          <span>
            Developed For
          </span>

          <strong>
            Infosys Springboard Virtual Internship
          </strong>

        </div>

      </div>


    </div>

  );

}

export default Settings;