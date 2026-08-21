import {
    Menu,
    X,
    Sun,
    Moon,
    Activity,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    useTheme,
} from "../context/ThemeContext";

import {
    useAuth,
} from "../context/AuthContext";


// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {

    const [scrolled, setScrolled] =
        useState(false);

    const [mobileOpen, setMobileOpen] =
        useState(false);

    const {
        theme,
        toggleTheme,
        isDark,
    } = useTheme();

    const {
        isAuthenticated,
        user,
    } = useAuth();


    // ========================================================
    // SCROLL EFFECT
    // ========================================================

    useEffect(() => {

        const handleScroll = () => {

            setScrolled(
                window.scrollY > 30
            );

        };

        window.addEventListener(
            "scroll",
            handleScroll,
            { passive: true }
        );

        handleScroll();

        return () => {

            window.removeEventListener(
                "scroll",
                handleScroll
            );

        };

    }, []);


    // ========================================================
    // NAVIGATION
    // ========================================================

    const navLinks = [
        {
            name: "Features",
            href: "#features",
        },
        {
            name: "How It Works",
            href: "#how",
        },
        {
            name: "Dashboard",
            href: "#dashboard",
        },
    ];


    // ========================================================
    // MOBILE MENU
    // ========================================================

    const closeMobile = () => {
        setMobileOpen(false);
    };


    const toggleMobile = () => {

        setMobileOpen(
            (previous) => !previous
        );

    };


    // ========================================================
    // DASHBOARD DESTINATION
    // ========================================================

    const dashboardPath =
        isAuthenticated
            ? "/dashboard"
            : "/login";


    // ========================================================
    // USER DISPLAY
    // ========================================================

    const username =
        user?.username ||
        user?.name ||
        null;


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <header
            className={`public-navbar ${
                scrolled
                    ? "scrolled"
                    : ""
            }`}
        >

            <div className="navbar-inner">


                {/* ==================================================
                    BRAND
                    ================================================== */}

                <Link
                    to="/"
                    className="public-brand"
                    onClick={closeMobile}
                >

                    <div className="public-brand-icon">

                        <Activity
                            size={22}
                            strokeWidth={2}
                        />

                    </div>


                    <div className="public-brand-text">

                        <div className="public-brand-title">

                            SportSense{" "}

                            <span>
                                AI
                            </span>

                        </div>


                        <div className="public-brand-subtitle">

                            Sports Injury Intelligence

                        </div>

                    </div>

                </Link>


                {/* ==================================================
                    DESKTOP NAVIGATION
                    ================================================== */}

                <nav
                    className="public-nav"
                    aria-label="Public navigation"
                >

                    {navLinks.map(
                        (link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="public-nav-link"
                                onClick={
                                    closeMobile
                                }
                            >
                                {link.name}
                            </a>
                        )
                    )}


                    {/* ==================================================
                        THEME
                        ================================================== */}

                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={
                            toggleTheme
                        }
                        aria-label={
                            isDark
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                        title={
                            isDark
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                    >

                        {isDark ? (
                            <Sun
                                size={18}
                            />
                        ) : (
                            <Moon
                                size={18}
                            />
                        )}

                        <span>
                            {isDark
                                ? "Light"
                                : "Dark"
                            }
                        </span>

                    </button>


                    {/* ==================================================
                        AUTHENTICATED USER
                        ================================================== */}

                    {isAuthenticated ? (

                        <>

                            <Link
                                to="/dashboard"
                                className="public-login-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Dashboard
                            </Link>


                            {username && (
                                <span
                                    className="public-user-name"
                                    title={username}
                                >
                                    {username}
                                </span>
                            )}

                        </>

                    ) : (

                        <>

                            {/* LOGIN */}

                            <Link
                                to="/login"
                                className="public-login-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Login
                            </Link>


                            {/* REGISTER */}

                            <Link
                                to="/register"
                                className="public-register-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Get Started
                            </Link>

                        </>

                    )}

                </nav>


                {/* ==================================================
                    MOBILE MENU BUTTON
                    ================================================== */}

                <button
                    type="button"
                    className="public-mobile-button"
                    onClick={
                        toggleMobile
                    }
                    aria-label={
                        mobileOpen
                            ? "Close navigation menu"
                            : "Open navigation menu"
                    }
                    aria-expanded={
                        mobileOpen
                    }
                >

                    {mobileOpen ? (

                        <X
                            size={24}
                        />

                    ) : (

                        <Menu
                            size={24}
                        />

                    )}

                </button>

            </div>


            {/* ==================================================
                MOBILE MENU
                ================================================== */}

            {mobileOpen && (

                <div
                    className="public-mobile-menu"
                >

                    {navLinks.map(
                        (link) => (

                            <a
                                key={link.name}
                                href={link.href}
                                className="public-mobile-link"
                                onClick={
                                    closeMobile
                                }
                            >
                                {link.name}
                            </a>

                        )
                    )}


                    {/* ==================================================
                        MOBILE THEME
                        ================================================== */}

                    <button
                        type="button"
                        className="mobile-theme-button"
                        onClick={
                            toggleTheme
                        }
                    >

                        {isDark ? (

                            <Sun
                                size={18}
                            />

                        ) : (

                            <Moon
                                size={18}
                            />

                        )}

                        <span>
                            {isDark
                                ? "Light Mode"
                                : "Dark Mode"
                            }
                        </span>

                    </button>


                    {/* ==================================================
                        MOBILE AUTH
                        ================================================== */}

                    {isAuthenticated ? (

                        <>

                            <Link
                                to={dashboardPath}
                                className="public-login-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Dashboard
                            </Link>


                            <Link
                                to="/profile"
                                className="public-register-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Profile
                            </Link>

                        </>

                    ) : (

                        <>

                            <Link
                                to="/login"
                                className="public-login-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Login
                            </Link>


                            <Link
                                to="/register"
                                className="public-register-btn"
                                onClick={
                                    closeMobile
                                }
                            >
                                Get Started
                            </Link>

                        </>

                    )}

                </div>

            )}

        </header>
    );
}