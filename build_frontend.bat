@echo off
echo ========================================
echo Building React Frontend...
echo ========================================

cd /d "%~dp0\frontend"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Building React app...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build successful!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Run: cd ..\core ^&^& python manage.py runserver
    echo 2. Open: http://localhost:8000
    echo.
) else (
    echo.
    echo ========================================
    echo Build failed!
    echo ========================================
)

cd /d "%~dp0"
