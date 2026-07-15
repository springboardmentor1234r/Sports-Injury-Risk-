import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <Link to="/" className="brand" style={{ color: "inherit" }}>
        <span className="dot" />
        Sports Injury Risk Detection
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="badge">{user.role.replace("_", " ")}</span>
            <span className="muted">{user.full_name}</span>
            <button className="btn btn-danger" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
