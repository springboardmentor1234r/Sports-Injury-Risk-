import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-bold text-indigo-600 text-lg">
        Sports Injury Risk Detection
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            {user.role === "athlete" && (
              <Link to="/my-profile" className="text-slate-600 hover:text-indigo-600">My Profile</Link>
            )}
            {["coach", "physiotherapist", "sports_scientist", "admin"].includes(user.role) && (
              <Link to="/athletes" className="text-slate-600 hover:text-indigo-600">Athletes</Link>
            )}
            <span className="text-slate-400">{user.full_name} ({user.role})</span>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-600 hover:text-indigo-600">Log in</Link>
            <Link to="/register" className="text-slate-600 hover:text-indigo-600">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
