import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

export default function Topbar({ activePage, userName }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const links = [
    { key: 'overview', label: 'Overview', path: '/dashboard' },
    { key: 'videos', label: 'Videos', path: '/videos' },
    { key: 'analysis', label: 'Analysis', path: '/analysis' },
    { key: 'profile', label: 'My Profile', path: '/profile' },
  ];

  const go = async (path, disabled) => {
  if (disabled) return;

  setMenuOpen(false);

  // If Analysis button clicked
  if (path === "/analysis") {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/videos/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const videos = await res.json();

      // latest analyzed video
      const analyzed = videos
        .filter(v => v.status === "analyzed")
        .sort((a, b) => b.id - a.id);

      if (analyzed.length > 0) {
        navigate(`/analysis?video=${analyzed[0].id}`);
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }

  navigate(path);
};

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">
          <span className="logo-dot" />
          SIRD
        </span>
        <nav className="topbar-links topbar-links--desktop">
          {links.map((l) => (
            <button
              key={l.key}
              className={`topbar-link ${activePage === l.key ? 'active' : ''}`}
              onClick={() => go(l.path, l.disabled)}
              disabled={l.disabled}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-right topbar-right--desktop">
        <span className="topbar-user">{userName}</span>
        <button className="topbar-signout" onClick={handleSignOut}>Sign out</button>
      </div>

      <button
        className={`topbar-hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <div className={`topbar-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <button
            key={l.key}
            className={`topbar-mobile-link ${activePage === l.key ? 'active' : ''}`}
            onClick={() => go(l.path, l.disabled)}
            disabled={l.disabled}
          >
            {l.label}
          </button>
        ))}
        <div className="topbar-mobile-footer">
          <span className="topbar-user">{userName}</span>
          <button className="topbar-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
