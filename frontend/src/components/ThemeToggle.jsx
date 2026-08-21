import {
    Moon,
    Sun,
} from "lucide-react";

import {
    useTheme,
} from "../context/ThemeContext";


export default function ThemeToggle({
    compact = false,
}) {

    const {
        isDark,
        toggleTheme,
    } = useTheme();


    return (

        <button
            type="button"
            className={
                `theme-toggle ${
                    compact
                        ? "theme-toggle-compact"
                        : ""
                }`
            }
            onClick={toggleTheme}
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
                    strokeWidth={1.9}
                />
            ) : (
                <Moon
                    size={18}
                    strokeWidth={1.9}
                />
            )}

            {!compact && (
                <span>
                    {isDark
                        ? "Light"
                        : "Dark"}
                </span>
            )}

        </button>

    );
}