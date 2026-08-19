import { NavLink } from "react-router-dom";
import { User, Users, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import KeypointMotif from "./ui/KeypointMotif";

const STAFF_ROLES = ["coach", "physiotherapist", "sports_scientist", "admin"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? "bg-gradient-brand text-ink shadow-glow"
        : "text-muted hover:text-paper hover:bg-white/[0.04]"
    }`;

  return (
    <aside className="w-64 shrink-0 p-4 h-screen sticky top-0 flex flex-col gap-4">
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-2.5">
        <KeypointMotif className="w-5 h-auto" />
        <div>
          <p className="font-display font-semibold text-sm text-paper leading-tight">Vantage</p>
          <p className="text-[11px] text-muted leading-tight">Injury Risk Intelligence</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <p className="text-[11px] text-muted mb-1">{greeting()},</p>
        <p className="font-display font-semibold text-paper truncate">{user?.full_name?.split(" ")[0]}</p>
      </div>

      <nav className="glass-panel rounded-2xl p-3 flex-1 space-y-1">
        {user?.role === "athlete" && (
          <NavLink to="/my-profile" className={linkClass}>
            <User size={17} strokeWidth={2} />
            My Profile
          </NavLink>
        )}
        {STAFF_ROLES.includes(user?.role) && (
          <NavLink to="/team-overview" className={linkClass}>
            <LayoutDashboard size={17} strokeWidth={2} />
            Team Overview
          </NavLink>
        )}
        {STAFF_ROLES.includes(user?.role) && (
          <NavLink to="/athletes" className={linkClass}>
            <Users size={17} strokeWidth={2} />
            Athletes
          </NavLink>
        )}
      </nav>

      <div className="glass-panel rounded-2xl p-3">
        <div className="flex items-center gap-3 px-1 py-1 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-ink text-xs font-display font-semibold shrink-0">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-paper truncate leading-tight">{user?.full_name}</p>
            <p className="text-[11px] text-muted capitalize leading-tight">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-coral hover:bg-coral-soft transition-colors w-full"
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
