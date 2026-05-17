# 360Presence — Complete Technical Documentation

## Table of Contents
1. [Backend Architecture](#1-backend-architecture)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Student Dashboard Implementation](#5-student-dashboard-implementation)
6. [Admin Dashboard Implementation](#6-admin-dashboard-implementation)
7. [Frontend-Backend Integration](#7-frontend-backend-integration)
8. [Geofencing System](#8-geofencing-system)
9. [Live Monitoring System](#9-live-monitoring-system)
10. [Authentication Flow](#10-authentication-flow)
11. [Build & Deployment](#11-build--deployment)

---

## 1. Backend Architecture

### Technology Stack
- **Framework**: Django 6.0 (Python)
- **Database**: PostgreSQL 17
- **API**: Django REST Framework (function-based views)
- **Authentication**: Django session-based auth with CSRF
- **CORS**: django-cors-headers (open for development)

### Project Structure
```
core/
├── accounts/              # Custom user app
│   ├── models.py          # User model with user_type, location fields
│   └── views.py           # (unused, logic in presence/)
├── presence/              # Core business logic
│   ├── models.py          # Event, Attendance, Announcement models
│   ├── student_views.py   # Student-facing API endpoints
│   ├── admin_views.py     # Admin-facing API endpoints
│   ├── page_views.py      # Page rendering views (login, dashboard)
│   └── api_views.py       # (legacy, unused)
├── core/
│   ├── settings.py        # Django configuration
│   └── urls.py            # URL routing
├── templates/             # Django HTML templates
│   ├── admin_dashboard.html
│   ├── login.html
│   ├── admin_login.html
│   └── register.html
└── static/                # Compiled React build output
    └── react/
        └── index.html     # React SPA entry point
```

### Design Decisions
- **Function-based views** over class-based for simplicity and direct JSON responses
- **Session authentication** instead of JWT — Django sessions work seamlessly with both Django templates and React SPA when `credentials: 'include'` is set
- **@csrf_exempt** on student APIs — the React frontend sends JSON without CSRF tokens; admin APIs use `@staff_member_required` which enforces CSRF via Django's session middleware
- **PostgreSQL** chosen over SQLite for production readiness, concurrent access, and GIS potential

---

## 2. Database Schema

### accounts.User (Custom User Model)
Extends Django's `AbstractUser` with additional fields:

| Field | Type | Purpose |
|-------|------|---------|
| `user_type` | CharField(10) | `'student'` or `'admin'` — role separation |
| `phone` | CharField(15) | Optional contact number |
| `last_latitude` | FloatField | Student's last reported GPS latitude |
| `last_longitude` | FloatField | Student's last reported GPS longitude |
| `last_location_update` | DateTimeField | Timestamp of last location report |
| `is_staff` | Boolean (inherited) | Django admin access; used to filter out admins from attendance |

**Key**: `AUTH_USER_MODEL = 'accounts.User'` in settings.py

### presence.Event
Represents a trackable gathering with geofence boundaries:

| Field | Type | Purpose |
|-------|------|---------|
| `name` | CharField(200) | Event display name |
| `description` | TextField | Optional details |
| `category` | CharField(20) | seminar, workshop, conference, orientation, exam, meeting, other |
| `latitude` | FloatField | Geofence center latitude |
| `longitude` | FloatField | Geofence center longitude |
| `radius` | IntegerField | Geofence radius in meters (default: 100) |
| `start_time` | DateTimeField | Event start (timezone-aware) |
| `end_time` | DateTimeField | Event end (timezone-aware) |
| `created_by` | ForeignKey(User) | Admin who created the event |
| `is_active` | BooleanField | Whether event accepts check-ins |

### presence.Attendance
Records student check-in/out sessions:

| Field | Type | Purpose |
|-------|------|---------|
| `student` | ForeignKey(User) | The attending student |
| `event` | ForeignKey(Event) | The attended event |
| `check_in` | DateTimeField | When student entered geofence |
| `check_out` | DateTimeField | When student left geofence (nullable) |

**Logic**: A null `check_out` means the student is currently inside the event radius. Duration is calculated as `(check_out - check_in).total_seconds() / 60`.

### presence.Announcement
Admin broadcasts to students:

| Field | Type | Purpose |
|-------|------|---------|
| `message` | CharField(500) | Announcement text |
| `created_by` | ForeignKey(User) | Admin who sent it |
| `created_at` | DateTimeField(auto) | Timestamp |
| `event` | ForeignKey(Event, nullable) | Optional event association |

**Ordering**: `['-created_at']` — newest first

---

## 3. API Endpoints

### Student APIs (presence/student_views.py)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/register/` | POST | None | Create student account. Expects: `{username, password, email, phone, first_name, last_name}` |
| `/api/login/` | POST | None | Authenticate. Expects: `{username, password, role}`. Role enforces login page separation. Returns: `{success, token, user_id, username, full_name, email, user_type, is_staff, redirect}` |
| `/api/logout/` | POST | Session | Destroy session |
| `/api/user/` | GET | Session | Get current user info |
| `/api/events/` | GET | Session | Get all active events with computed status (`upcoming`/`active`/`past`) based on `timezone.now()` |
| `/api/track/` | POST | Session | **Core geofencing endpoint**. Expects: `{event_id, latitude, longitude}`. Calculates Haversine distance, determines if inside radius, auto check-in/out. Updates `User.last_latitude/longitude/location_update` for live monitoring |
| `/api/my-attendance/` | GET | Session | Get student's attendance history with duration calculation |
| `/api/announcements/` | GET | Session | Get announcements from last 30 minutes (max 10) |
| `/api/present-students/<event_id>/` | GET | Session | Get students currently checked in to specific event (open attendance sessions) |

### Admin APIs (presence/admin_views.py)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/events/` | GET/POST | Staff | List/create events (filtered by `created_by=request.user`) |
| `/api/admin/events/<id>/` | GET/PUT/DELETE | Staff | Manage single event |
| `/api/admin/live-students/` | GET | Staff | Get all students with recent location updates OR open attendance sessions. Includes `is_inside` calculation against all active events |
| `/api/admin/attendance/` | GET | Staff | All attendance records (excludes staff). Ordered by event start time |
| `/api/admin/export/` | GET | Staff | CSV download. Optional `?event=name` filter |
| `/api/admin/students/` | GET | Staff | List all students with attendance rate calculation |
| `/api/admin/announce/` | POST | Staff | Create announcement |

---

## 4. Frontend Architecture

### Dual Frontend Strategy

| Interface | Technology | Served From | Purpose |
|-----------|-----------|-------------|---------|
| **Admin Dashboard** | Django template (`admin_dashboard.html`) + vanilla JS | Django renders directly | Full-featured admin panel with live monitoring, event CRUD, attendance records |
| **Student Dashboard** | React 19 SPA (Vite build) | Django serves `static/react/index.html` | Modern student-facing UI with maps, check-in, attendance history |
| **Login/Register** | Django templates (`login.html`, `admin_login.html`, `register.html`) | Django renders directly | Authentication entry points |

### React Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Router with AnimatePresence
│   ├── index.css          # Tailwind imports + global styles
│   ├── pages/
│   │   ├── LoginPage.jsx  # Login/Register with toggle
│   │   └── StudentDashboard.jsx  # Full student console (1434 lines)
│   └── utils/
│       └── api.js         # Centralized fetch wrapper
├── vite.config.js         # Vite config with build output to core/static/react/
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

### Key Dependencies
- **React 19** + **React Router DOM 7** — routing with SPA navigation
- **Framer Motion** — page transitions, hero animations, toast notifications
- **MapLibre GL JS 5** — vector map rendering (replaced Leaflet)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — 3D capabilities (available, not actively used in current build)
- **GSAP** — advanced animations (available)
- **Tailwind CSS 3** — utility-first styling
- **Axios** — HTTP client (available, but `api.js` uses native `fetch`)
- **Lucide React** — icon library (used in LoginPage)

---

## 5. Student Dashboard Implementation

### File: `frontend/src/pages/StudentDashboard.jsx`

### Architecture
Single component file (~1434 lines) with inline sub-components. No external state management — uses React `useState`/`useEffect` hooks.

### State Management
```javascript
const [activeTab, setActiveTab] = useState('overview');     // Tab navigation
const [events, setEvents] = useState([]);                    // Event list from API
const [myAttendance, setMyAttendance] = useState([]);        // Attendance history
const [checkingIn, setCheckingIn] = useState(null);          // Loading state for check-in
const [toast, setToast] = useState(null);                    // Toast notification
const [announcements, setAnnouncements] = useState([]);      // Admin announcements
const [dismissedIds, setDismissedIds] = useState(new Set()); // Dismissed announcements (localStorage)
const [selectedMapEvent, setSelectedMapEvent] = useState(null); // Selected event for map view
const [presentStudents, setPresentStudents] = useState([]);  // Students inside selected event
const [myLocation, setMyLocation] = useState(null);          // Student's real-time GPS
const [user, setUser] = useState({...});                     // User profile from localStorage
```

### Tabs
| Tab | Content |
|-----|---------|
| **Overview** | Hero greeting, stats strip (events attended, rate, upcoming, live), next event preview |
| **Events** | Full event list with date, venue, radius, status, check-in button |
| **Live Map** | MapLibre GL JS map showing event geofence, present students, and student's own location |
| **History** | Attendance ledger with event, date, check-in time, status |
| **Account** | Profile details with dark/light split layout, logout button |

### Map Implementation (Live Map Tab)
1. **Map Initialization**: Created when `activeTab === 'map'` using CartoDB Dark basemap
2. **Event Circle**: GeoJSON circle layer calculated from event `latitude`, `longitude`, `radius`
3. **Student Markers**: Blue dots (`#3b82f6`) for each present student from `/api/present-students/<id>/`
4. **Own Location**: Blue pulsing marker from `navigator.geolocation.watchPosition()`
5. **Event Center**: Crosshair-style marker at geofence center
6. **Polling**: Present students refreshed every 5 seconds
7. **Cleanup**: Map destroyed when switching away from map tab

### Check-In Flow
1. User clicks "Check in" on an event
2. `getCurrentLocation()` calls `navigator.geolocation.getCurrentPosition()`
3. Sends `{event_id, latitude, longitude}` to `/api/track/`
4. Backend calculates Haversine distance, determines inside/outside
5. If inside and no open session → creates Attendance record (check-in)
6. If outside and has open session → sets `check_out` timestamp
7. Toast notification shows result
8. `loadData()` refreshes events and attendance

### Data Loading
- **Initial load**: `loadData()` + `loadAnnouncements()` on mount
- **Polling**: Announcements every 15s, events/attendance every 30s
- **Fallback**: Mock data used if API fails (development convenience)

### Design System
- **Fonts**: Hanken Grotesk (primary), Inter (secondary/labels/numbers)
- **Palette**: Warm off-white (`#f4f3ef`), warm near-black (`#141412`), muted (`#7a766d`)
- **Dark mode sections**: Hero, map, footer use dark palette (`#0b0c0a`)
- **Animations**: Framer Motion for page transitions, card entrances, toast appearances
- **Typography**: Large display text (clamp 64px-144px), tabular numbers, uppercase labels

---

## 6. Admin Dashboard Implementation

### File: `core/templates/admin_dashboard.html`

### Architecture
Single HTML file with embedded CSS and JavaScript (~840 lines). No build step — served directly by Django.

### Layout
- **Sidebar**: Navigation tabs (Dashboard, Events, Live Monitor, Students, Records), user avatar, logout
- **Main Content**: Tab-based content area
- **Top Bar**: Search, announcements banner

### Tabs
| Tab | Content |
|-----|---------|
| **Dashboard** | Stats cards (total events, active students, attendance count), recent activity |
| **Events** | Event list with create/edit/delete modals, activate/deactivate toggle |
| **Live Monitor** | MapLibre GL JS map with event filter dropdown, student list, broadcast controls |
| **Students** | Student table with attendance rates, last seen, status |
| **Records** | Attendance records grouped by event, filter dropdown, CSV export |

### Live Monitor Map Implementation
1. **Map Initialization**: Created on tab switch using CartoDB Light basemap
2. **Data Loading**: `loadStudents()` fetches `/api/admin/live-students/` + `/api/admin/events/` in parallel
3. **Event Markers**: Purple (`#8b5cf6`) center markers with popups showing event name and radius
4. **Event Circles**: Purple GeoJSON polygon outlines calculated from event coordinates and radius
5. **Student Markers**: Blue (`#3b82f6`) dots for each student with location data
6. **Event Filter**: Dropdown filters map to show only selected event and students inside its radius
7. **Polling**: Refreshes every 5 seconds via `setInterval`
8. **Guard**: `if (!monitorMap || !monitorMap.loaded()) return;` prevents crashes

### Student List
- Shows students filtered by selected event
- Displays initials avatar, name, inside/outside status
- Green dot (`#16a34a`) for inside, red dot (`#dc2626`) for outside

### Attendance Records
- Fetches from `/api/admin/attendance/`
- Groups records by event name with header rows
- Filter dropdown populated from `/api/admin/events/` (all events, not just those with records)
- CSV export via `/api/admin/export/?event=name`

### Broadcast System
- Text input + "Broadcast" button sends POST to `/api/admin/announce/`
- "Allow leave radius" button broadcasts predefined message
- Announcement banner appears in student dashboard

---

## 7. Frontend-Backend Integration

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Student Login (React SPA via Django template)              │
│  ┌──────────┐    POST /api/login/    ┌──────────────────┐   │
│  │ LoginPage│ ──────────────────────>│ student_login()  │   │
│  │ .jsx     │  {username, password,  │                  │   │
│  │          │   role: 'student'}     │ authenticate()   │   │
│  └──────────┘                        │ login(request)   │   │
│       │                              │ return JSON      │   │
│       │  {success, full_name,        └──────────────────┘   │
│       │   redirect: '/student-dashboard/'}                   │
│       │                                                      │
│       ▼                                                      │
│  localStorage.setItem(token, username, full_name)            │
│  navigate('/dashboard')                                      │
│       │                                                      │
│       ▼                                                      │
│  Django serves static/react/index.html                       │
│  React Router renders StudentDashboard                       │
│  All API calls use credentials: 'include' (session cookie)   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin Login (Django template)                               │
│  ┌──────────────┐  POST /admin-login/  ┌─────────────────┐  │
│  │ admin_login  │ ────────────────────>│ Django's        │  │
│  │ .html        │                      │ auth_login()    │  │
│  └──────────────┘                      └─────────────────┘  │
│       │                                     │                │
│       │  Session cookie set                 │                │
│       ▼                                     ▼                │
│  Redirect to /admin-dashboard/             @staff_member     │
│  Django renders admin_dashboard.html       required guard    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Session Sharing
Both frontends share the same Django session:
- React SPA uses `credentials: 'include'` on all fetch calls
- Django sets `sessionid` cookie on login
- All API endpoints use `@login_required` or `@staff_member_required`
- CORS configured with `CORS_ALLOW_ALL_ORIGINS = True` and `CORS_ALLOW_CREDENTIALS = True`

### Data Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Student   │         │   Django     │         │    Admin    │
│  Dashboard  │         │   Backend    │         │  Dashboard  │
│  (React)    │         │              │         │  (Template) │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ POST /api/track/      │                        │
       │ {lat, lng, event_id}  │                        │
       │──────────────────────>│                        │
       │                       │  Haversine calc        │
       │                       │  Attendance create     │
       │                       │  User location update  │
       │  {checked_in,         │                        │
       │   is_inside, dist}    │                        │
       │<──────────────────────│                        │
       │                       │                        │
       │                       │  GET /api/admin/       │
       │                       │  live-students/        │
       │                       │<───────────────────────│
       │                       │                        │
       │                       │  {students: [{         │
       │                       │   name, lat, lng,      │
       │                       │   is_inside}]}         │
       │                       │───────────────────────>│
       │                       │                        │
       │  GET /api/events/     │                        │
       │<──────────────────────│                        │
       │                       │  POST /api/admin/      │
       │                       │  announce/             │
       │                       │<───────────────────────│
       │  GET /api/            │                        │
       │  announcements/       │                        │
       │<──────────────────────│                        │
```

---

## 8. Geofencing System

### Haversine Formula
Used in both `student_views.py` and `admin_views.py`:

```python
R = 6371000  # Earth radius in meters
p1, p2 = radians(lat1), radians(lat2)
dphi = radians(lat2 - lat1)
dlmb = radians(lon2 - lon1)
a = sin(dphi/2)**2 + cos(p1)*cos(p2)*sin(dlmb/2)**2
distance = R * 2 * atan2(sqrt(a), sqrt(1-a))
is_inside = distance <= event.radius
```

### Check-In Logic (`track_attendance`)
1. Student sends GPS coordinates + event_id
2. Backend updates `User.last_latitude/longitude/location_update`
3. Calculates distance to event center
4. **Inside + no open session** → `Attendance.objects.create(check_in=now)`
5. **Outside + has open session** → `attendance.check_out = now`
6. Returns `{is_inside, distance_meters, checked_in/checked_out, message}`

### Edge Cases Handled
- **Re-entry**: If student checks out then re-enters, a new Attendance record is created
- **Multiple sessions**: Student can have multiple check-in/out records per event
- **No GPS**: Returns error if latitude/longitude missing
- **Event not found**: Returns 404

---

## 9. Live Monitoring System

### Admin Live Students Endpoint (`/api/admin/live-students/`)

**Two student pools combined**:
1. **Recent location**: Students with `last_location_update` within last 60 minutes
2. **Checked-in**: Students with open attendance sessions (`check_out__isnull=True`)

**Query**:
```python
students_recent = User.objects.filter(
    user_type='student', is_staff=False,
    last_latitude__isnull=False, last_longitude__isnull=False,
    last_location_update__gte=recent_cutoff
)
students_checked_in = User.objects.filter(
    id__in=checked_in_student_ids, is_staff=False,
    last_latitude__isnull=False, last_longitude__isnull=False
)
students = (students_recent | students_checked_in).distinct()
```

**is_inside calculation**: For each student, checks distance against ALL active events. If inside ANY event, `is_inside = True`.

### Frontend Polling
- **Admin map**: Polls every 5 seconds via `setInterval(loadStudents, 5000)`
- **Student map**: Polls present students every 5 seconds
- **Student announcements**: Polls every 15 seconds
- **Student events/attendance**: Polls every 30 seconds

---

## 10. Authentication Flow

### Role Separation
- **Student login** (`/api/login/` with `role: 'student'`): Rejects if `user.is_staff == True`
- **Admin login** (`/admin-login/` Django form): Uses `@staff_member_required` — only allows `is_staff == True` users
- Prevents students from accessing admin dashboard and vice versa

### Session Persistence
- Django session cookie (`sessionid`) persists across page reloads
- React SPA stores `token`, `username`, `full_name`, `user_type` in `localStorage` for display purposes
- Actual auth validation always goes through Django session — localStorage values are cosmetic only

### Logout
- **Student**: `POST /api/logout/` → `logout(request)` → clears session → React clears localStorage → redirects to `/`
- **Admin**: Django's built-in logout via `/admin/logout/` or sidebar button

---

## 11. Build & Deployment

### Development
```bash
# Terminal 1: Django backend
cd core
python manage.py runserver 8000

# Terminal 2: React dev server (optional, for hot reload)
cd frontend
npm run dev
# Access at http://localhost:5173 (proxy to Django API)
```

### Production Build
```bash
# Build React frontend
cd frontend
npm run build
# Output: frontend/dist/ → copied to core/static/react/

# Collect static files
cd ../core
python manage.py collectstatic --noinput

# Start Django server
python manage.py runserver 8000
```

### Vite Configuration
`vite.config.js` outputs build to `../core/static/react/`:
```javascript
build: {
  outDir: '../core/static/react',
  emptyOutDir: true,
}
```

### Django Serves React
`page_views.dashboard()` reads `core/static/react/index.html` and returns it as HttpResponse. All React routes are handled client-side by React Router.

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

### One-Click Start
`run_server.bat`:
1. Runs `python manage.py migrate --run-syncdb`
2. Opens browser to `http://localhost:8000`
3. Starts Django dev server

---

## Appendix: Key File Locations

| File | Purpose |
|------|---------|
| `core/accounts/models.py` | Custom User model |
| `core/presence/models.py` | Event, Attendance, Announcement models |
| `core/presence/student_views.py` | Student API endpoints |
| `core/presence/admin_views.py` | Admin API endpoints |
| `core/presence/page_views.py` | Page rendering views |
| `core/core/urls.py` | URL routing |
| `core/core/settings.py` | Django configuration |
| `core/templates/admin_dashboard.html` | Admin dashboard (vanilla JS + MapLibre) |
| `core/templates/login.html` | Student login template |
| `core/templates/admin_login.html` | Admin login template |
| `core/templates/register.html` | Student registration template |
| `frontend/src/pages/StudentDashboard.jsx` | React student dashboard |
| `frontend/src/pages/LoginPage.jsx` | React login page |
| `frontend/src/utils/api.js` | API client wrapper |
| `frontend/vite.config.js` | Vite build configuration |
| `run_server.bat` | Windows startup script |
| `build_frontend.bat` | React build script |
