@echo off
REM Double-click this file to install everything and start the app.
REM Do not move this file out of this folder.

cd /d "%~dp0"

echo ============================================
echo  KinetIQ setup - please wait, this can take
echo  a few minutes the first time.
echo ============================================
echo.

where bun >nul 2>nul
if %ERRORLEVEL%==0 (
    echo Using bun...
    call bun install
    if errorlevel 1 goto :error
    echo.
    echo Starting the app - opening http://localhost:8080
    echo Leave this window open. Press Ctrl+C here to stop the app.
    echo.
    call bun run dev
) else (
    echo bun not found, using npm instead...
    call npm install
    if errorlevel 1 goto :error
    echo.
    echo Starting the app - opening http://localhost:8080
    echo Leave this window open. Press Ctrl+C here to stop the app.
    echo.
    call npm run dev
)
goto :eof

:error
echo.
echo Something went wrong during install. Scroll up to see the error,
echo and send it as a screenshot.
pause
