// Backend API URL - configure this in your Vercel project settings
// Go to your Vercel project → Settings → Environment Variables
// Add: NEXT_PUBLIC_API_URL = your-django-backend-url (e.g., https://your-app.onrender.com)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const api = {
  login: (data) => fetch(`${API_BASE}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  }).then(r => r.json()),

  register: (data) => fetch(`${API_BASE}/api/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  }).then(r => r.json()),

  getUser: () => fetch(`${API_BASE}/api/user/`, {
    credentials: 'include',
  }).then(r => r.json()),

  getEvents: () => fetch(`${API_BASE}/api/events/`, {
    credentials: 'include',
  }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }),

  trackAttendance: (data) => fetch(`${API_BASE}/api/track/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  }).then(r => r.json()),

  myAttendance: () => fetch(`${API_BASE}/api/my-attendance/`, {
    credentials: 'include',
  }).then(r => r.json()),

  presentStudents: (eventId) => fetch(`${API_BASE}/api/present-students/${eventId}/`, {
    credentials: 'include',
  }).then(r => r.json()),

  announcements: () => fetch(`${API_BASE}/api/announcements/`, {
    credentials: 'include',
  }).then(r => r.json()),

  adminEvents: () => fetch(`${API_BASE}/api/admin/events/`, {
    credentials: 'include',
  }).then(r => r.json()),

  adminStudents: () => fetch(`${API_BASE}/api/admin/students/`, {
    credentials: 'include',
  }).then(r => r.json()),

  adminAttendance: () => fetch(`${API_BASE}/api/admin/attendance/`, {
    credentials: 'include',
  }).then(r => r.json()),

  liveStudents: () => fetch(`${API_BASE}/api/admin/live-students/`, {
    credentials: 'include',
  }).then(r => r.json()),
};

export default api;