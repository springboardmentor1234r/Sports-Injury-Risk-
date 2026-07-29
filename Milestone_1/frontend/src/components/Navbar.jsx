import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Features", href: "#features" },
        { name: "Workflow", href: "#how" },
        { name: "Dashboard", href: "#dashboard" },
    ];

    return (
        <motion.nav
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled
                    ? "backdrop-blur-xl bg-[#081229]/80 border-b border-white/10 shadow-lg"
                    : "bg-transparent"
            }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

                {/* Logo */}

                <Link
                    to="/"
                    className="text-3xl font-extrabold text-white hover:text-blue-400 transition duration-300"
                >
                    SportSense
                    <span className="text-blue-500">AI</span>
                </Link>

                {/* Desktop Menu */}

                <div className="hidden md:flex gap-10">

                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="relative text-gray-300 hover:text-white transition duration-300 group"
                        >
                            {link.name}

                            <span className="absolute left-0 -bottom-2 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full"></span>

                        </a>
                    ))}

                </div>

                {/* Desktop Buttons */}

                <div className="hidden md:flex gap-4">

                    <Link
                        to="/login"
                        className="text-white hover:text-blue-400 transition"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl text-white transition hover:scale-105"
                    >
                        Get Started
                    </Link>

                </div>

                {/* Mobile Button */}

                <button
                    className="md:hidden text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X size={30} /> : <Menu size={30} />}
                </button>

            </div>

            {/* Mobile Menu */}

            {mobileOpen && (

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="md:hidden bg-[#081229] border-t border-white/10"
                >

                    {navLinks.map((link) => (

                        <a
                            key={link.name}
                            href={link.href}
                            className="block px-8 py-5 text-gray-300 hover:text-white"
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.name}
                        </a>

                    ))}

                    <Link
                        to="/login"
                        className="block px-8 py-5 text-white"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="block px-8 py-5 text-blue-400 font-bold"
                    >
                        Get Started
                    </Link>

                </motion.div>

            )}

        </motion.nav>
    );
}