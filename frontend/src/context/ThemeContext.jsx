// ============================================================
// SportSense AI
// Theme Context
// ============================================================

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    THEMES,
    getStoredTheme,
    saveTheme,
    applyTheme,
} from "../services/theme";

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

const ThemeContext = createContext(null);

// ------------------------------------------------------------
// THEME PROVIDER
// ------------------------------------------------------------

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(
        () => getStoredTheme()
    );

    // --------------------------------------------------------
    // APPLY THEME
    // --------------------------------------------------------

    useEffect(() => {
        applyTheme(theme);
        saveTheme(theme);
    }, [theme]);

    // --------------------------------------------------------
    // SET THEME
    // --------------------------------------------------------

    const setTheme = (nextTheme) => {
        if (
            nextTheme !== THEMES.LIGHT &&
            nextTheme !== THEMES.DARK
        ) {
            return;
        }

        setThemeState(nextTheme);
    };

    // --------------------------------------------------------
    // TOGGLE THEME
    // --------------------------------------------------------

    const toggleTheme = () => {
        setThemeState((currentTheme) =>
            currentTheme === THEMES.DARK
                ? THEMES.LIGHT
                : THEMES.DARK
        );
    };

    // --------------------------------------------------------
    // CONTEXT VALUE
    // --------------------------------------------------------

    const value = useMemo(
        () => ({
            theme,

            isDark:
                theme === THEMES.DARK,

            isLight:
                theme === THEMES.LIGHT,

            setTheme,

            toggleTheme,

            themes: THEMES,
        }),
        [theme]
    );

    // --------------------------------------------------------
    // PROVIDER
    // --------------------------------------------------------

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ------------------------------------------------------------
// useTheme HOOK
// ------------------------------------------------------------

export function useTheme() {
    const context =
        useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider."
        );
    }

    return context;
}

// ------------------------------------------------------------
// DEFAULT EXPORT
// ------------------------------------------------------------

export default ThemeContext;