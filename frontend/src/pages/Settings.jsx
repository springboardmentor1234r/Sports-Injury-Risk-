import { useState } from "react";
import "../styles/Settings.css";

function Settings() {
  const [theme, setTheme] = useState("Dark");

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="settings-page">

      <div className="settings-header">
        <h1>Settings</h1>
        <p>
          Manage your account and application preferences.
        </p>
      </div>

      {/* Profile */}

      <div className="settings-card">

        <h2>Profile Information</h2>

        <div className="setting-item">
          <span>Name</span>
          <strong>{user?.name || "Guest User"}</strong>
        </div>

        <div className="setting-item">
          <span>Email</span>
          <strong>{user?.email || "Not Available"}</strong>
        </div>

        <div className="setting-item">
  <span>Role</span>
  <strong>
    {user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "Guest"}
  </strong>
</div>

      </div>

      {/* Appearance */}

      <div className="settings-card">

        <h2>Appearance</h2>

        <div className="setting-item">
          <span>Theme</span>

          <select
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value)
            }
          >
            <option>Dark</option>
            <option disabled>
              Light (Coming Soon)
            </option>
          </select>

        </div>

      </div>

      {/* Security */}

      <div className="settings-card">

        <h2>Security</h2>

        <button className="settings-btn">
          Change Password
        </button>

        <button
          className="settings-btn logout-btn"
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>

      </div>

      {/* About */}

      <div className="settings-card">

        <h2> About</h2>

        <div className="setting-item">
          <span>Application</span>
          <strong>
            Sports Injury Risk Detection
          </strong>
        </div>

        <div className="setting-item">
          <span>Version</span>
          <strong>3.0</strong>
        </div>

        <div className="setting-item">
          <span>Developed For</span>
          <strong>
            Infosys Springboard Virtual Internship
          </strong>
        </div>

      </div>

    </div>
  );
}

export default Settings;