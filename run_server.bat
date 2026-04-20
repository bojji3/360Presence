@echo off
echo ========================================
echo Starting 360Presence
echo ========================================
echo.

cd /d "%~dp0\core"

echo Checking migrations...
python manage.py migrate --run-syncdb

echo.
echo Starting Django server...
echo App will be available at: http://localhost:8000
echo.

start "" http://localhost:8000

python manage.py runserver 8000
