/*
|--------------------------------------------------------------------------
| SportSense AI Theme Utilities
|--------------------------------------------------------------------------
|
| Theme state itself is managed by:
|
|     context/ThemeContext.jsx
|
| This file only provides reusable constants/helpers.
|
*/


export const THEMES = Object.freeze({
    LIGHT: "light",
    DARK: "dark",
});


const STORAGE_KEY =
    "sportsense-theme";


/*
|--------------------------------------------------------------------------
| Validate Theme
|--------------------------------------------------------------------------
*/

export function isValidTheme(
    theme
) {

    return (
        theme === THEMES.LIGHT ||
        theme === THEMES.DARK
    );
}


/*
|--------------------------------------------------------------------------
| Get Stored Theme
|--------------------------------------------------------------------------
*/

export function getStoredTheme() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (
            isValidTheme(saved)
        ) {
            return saved;
        }

    } catch (error) {

        console.warn(
            "Unable to read stored theme:",
            error
        );
    }


    return THEMES.LIGHT;
}


/*
|--------------------------------------------------------------------------
| Save Theme
|--------------------------------------------------------------------------
*/

export function saveTheme(
    theme
) {

    if (
        !isValidTheme(theme)
    ) {
        return;
    }


    try {

        localStorage.setItem(
            STORAGE_KEY,
            theme
        );

    } catch (error) {

        console.warn(
            "Unable to save theme:",
            error
        );
    }
}


/*
|--------------------------------------------------------------------------
| Apply Theme
|--------------------------------------------------------------------------
*/

export function applyTheme(
    theme
) {

    const selectedTheme =
        isValidTheme(theme)
            ? theme
            : THEMES.LIGHT;


    if (
        typeof document ===
        "undefined"
    ) {
        return selectedTheme;
    }


    document.documentElement
        .setAttribute(
            "data-theme",
            selectedTheme
        );


    document.body
        .setAttribute(
            "data-theme",
            selectedTheme
        );


    document.documentElement
        .style
        .colorScheme =
            selectedTheme;


    return selectedTheme;
}


/*
|--------------------------------------------------------------------------
| Initialize Theme
|--------------------------------------------------------------------------
*/

export function initializeTheme() {

    const theme =
        getStoredTheme();


    applyTheme(theme);


    return theme;
}


/*
|--------------------------------------------------------------------------
| Clear Stored Theme
|--------------------------------------------------------------------------
*/

export function clearStoredTheme() {

    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    } catch (error) {

        console.warn(
            "Unable to clear stored theme:",
            error
        );
    }
}