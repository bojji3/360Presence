# 360Presence

Real-time event attendance tracking system with geofence-based check-in, live monitoring, and analytics. Built with Django (PostgreSQL) backend and dual frontend (Django templates + React).

## Architecture

```
360Presence/
├── core/                 # Django backend
│   ├── accounts/         # Custom user model (students + admins)
│   ├── presence/         # Event management, attendance, geofencing, APIs
│   ├── templates/        # Django HTML templates (admin dashboard, login, register)
│   ├── static/           # Compiled React frontend + static assets
│   └── manage.py
├── frontend/             # React + Vite student dashboard
│   └── src/
│       └── pages/        # LoginPage, StudentDashboard, etc.
└── run_server.bat        # One-click startup script
```

## Tech Stack

- **Backend**: Django 6.0, Django REST Framework, PostgreSQL 17
- **Frontend (Admin)**: Django templates, vanilla JS, MapLibre GL JS
- **Frontend (Student)**: React 19, Vite, Tailwind CSS, MapLibre GL JS, Three.js, Framer Motion
- **Mapping**: MapLibre GL JS with CartoDB Light basemap
- **Styling**: Inter font, CSS custom properties, Tailwind CSS

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 17

## Database Setup

1. Install PostgreSQL 17 (default: `C:\Program Files\PostgreSQL\17`)
2. Create database and user:
   ```sql
   CREATE DATABASE "360presence";
   CREATE USER admin WITH PASSWORD 'admin2026';
   GRANT ALL PRIVILEGES ON DATABASE "360presence" TO admin;
   ```
3. Update credentials in `core/core/settings.py` if different.

## Quick Start

### Option 1: One-Click (Windows)
Double-click `run_server.bat` — applies migrations and starts Django dev server at `http://localhost:8000`.

### Option 2: Manual

**Backend:**
```bash
cd core
pip install django djangorestframework django-cors-headers psycopg2-binary
python manage.py migrate --run-syncdb
python manage.py runserver 8000
```

**Frontend (React student dashboard):**
```bash
cd frontend
npm install
npm run build          # Production build → copies to core/static/
# OR
npm run dev            # Dev server with hot reload (port 5173)
```

## Default Accounts

| Role | Username | Password | URL |
|------|----------|----------|-----|
| Admin | `admin` | `admin123` | `/admin-login/` |
| Student | `student` | `student123` | `/student-login/` |

## Key Endpoints

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/` | Register new student |
| POST | `/api/login/` | Student login |
| POST | `/api/logout/` | Student logout |
| GET | `/api/user/` | Get current user info |
| GET | `/api/events/` | Get active events |
| POST | `/api/track/` | Check-in/out with geolocation |
| GET | `/api/my-attendance/` | Get student's attendance history |
| GET | `/api/announcements/` | Get latest admin announcements |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/events/` | List/create events |
| GET/PUT/DELETE | `/api/admin/events/<id>/` | Manage single event |
| GET | `/api/admin/live-students/` | Get live student locations |
| GET | `/api/admin/attendance/` | Get attendance records |
| GET | `/api/admin/export/` | Export attendance as CSV |
| GET | `/api/admin/students/` | List all students |
| POST | `/api/admin/announce/` | Broadcast announcement |

## Features

### Admin Dashboard (`/admin-dashboard/`)
- **Live Monitor Map**: Real-time student tracking with purple event center markers and blue student location dots, purple geofence radius outlines
- **Event Filter Dropdown**: Filter live map and attendance records by event
- **Attendance Records**: Grouped by event, filterable, CSV export
- **Broadcast**: Send announcements to students
- **Allow Leave Radius**: Toggle geofence enforcement

### Student Dashboard (`/student-dashboard/`)
- **MapLibre GL JS**: Interactive map showing event locations and student position
- **Geofence Check-In**: Automatic check-in when inside event radius
- **Event Tabs**: Active, Upcoming, Past events with correct status labels
- **Attendance History**: Personal check-in/out records with duration
- **Announcements**: Real-time admin announcements

## Build Commands

| Command | Description |
|---------|-------------|
| `run_server.bat` | Apply migrations + start Django server |
| `build_frontend.bat` | Install deps + build React app |
| `npm run build` | Build React frontend (from `frontend/`) |
| `npm run dev` | Start Vite dev server (from `frontend/`) |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py collectstatic` | Collect static files for production |

## Configuration

### Database (core/core/settings.py)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '360presence',
        'USER': 'admin',
        'PASSWORD': 'admin2026',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### CORS
CORS is open for development (`CORS_ALLOW_ALL_ORIGINS = True`). Restrict in production.

### Timezone
Set to `Asia/Manila` in settings.

## Notes

- Django dev server runs on `http://localhost:8000`
- React dev server runs on `http://localhost:5173` (if using `npm run dev`)
- Production builds are served by Django from `core/static/`
- Geofence radius is calculated using Haversine formula on the backend
- Live map polls `/api/admin/live-students/` every 5 seconds
- Admin/staff accounts are excluded from attendance records and live student lists
