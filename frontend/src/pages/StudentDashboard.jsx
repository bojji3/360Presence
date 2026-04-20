import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

/* ──────────────────────────────────────────────────────────────────────
   360Presence — Student Console
   Aesthetic reference: icomat.co.uk — warm off-white ground, dark
   alternating panels, wide semibold grotesk, industrial mono labels.
   ────────────────────────────────────────────────────────────────────── */

const SANS = "'Hanken Grotesk', -apple-system, system-ui, sans-serif";
const MONO = "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace";

/* Warm off-white / warm near-black palette (mirroring icomat) */
const GROUND     = '#f4f3ef';
const GROUND_2   = '#eceae4';
const HAIR       = '#dcd9cf';
const HAIR_2     = '#c6c3b7';
const INK        = '#141412';
const INK_2      = '#2a2a26';
const MUTED      = '#7a766d';
const MUTED_2    = '#a9a59a';

const DARK       = '#0b0c0a';
const DARK_2     = '#141410';
const DARK_HAIR  = '#22221e';
const DARK_HAIR2 = '#34332d';
const ON_DARK    = '#f4f3ef';
const ON_DARK_2  = '#c6c3b7';
const ON_DARK_M  = '#7a766d';

const pad2 = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');

const EASE = [0.22, 1, 0.36, 1];

/* ── atoms ────────────────────────────────────────────────────── */

function Label({ children, dark = false, className = '' }) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: dark ? ON_DARK_M : MUTED,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

function PlusButton({ dark = false }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-90"
      style={{
        width: 34,
        height: 34,
        border: `1px solid ${dark ? ON_DARK_2 : INK}`,
        color: dark ? ON_DARK : INK,
        fontFamily: SANS,
        fontSize: 18,
        fontWeight: 400,
        lineHeight: 1,
      }}
    >
      +
    </span>
  );
}

function Arrow({ dark = false, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M1 11L11 1M11 1H3M11 1V9" stroke={dark ? ON_DARK : INK} strokeWidth="1.25" strokeLinecap="square"/>
    </svg>
  );
}

function RightArrow({ dark = false, size = 14 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" fill="none" aria-hidden>
      <path d="M13 1L19 7L13 13M19 7H1" stroke={dark ? ON_DARK : INK} strokeWidth="1.25" strokeLinecap="square"/>
    </svg>
  );
}

function InlineLink({ children, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-baseline gap-2 pb-[3px]"
      style={{
        fontFamily: SANS,
        fontSize: 15,
        fontWeight: 600,
        color: dark ? ON_DARK : INK,
        borderBottom: `1px solid ${dark ? ON_DARK : INK}`,
      }}
    >
      <span>{children}</span>
      <motion.span
        className="inline-block"
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >→</motion.span>
    </button>
  );
}

/* ── Logo: square mark + wordmark, monochrome ─────────────────── */
function Logo({ size = 40, dark = false }) {
  const color = dark ? ON_DARK : INK;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="39" stroke={color} strokeWidth="1.25"/>
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="1.25"/>
      <circle cx="20" cy="20" r="5" stroke={color} strokeWidth="1.25"/>
      <circle cx="20" cy="20" r="1.5" fill={color}/>
      <line x1="20" y1="4" x2="20" y2="9" stroke={color} strokeWidth="1.25"/>
      <line x1="20" y1="31" x2="20" y2="36" stroke={color} strokeWidth="1.25"/>
      <line x1="4" y1="20" x2="9" y2="20" stroke={color} strokeWidth="1.25"/>
      <line x1="31" y1="20" x2="36" y2="20" stroke={color} strokeWidth="1.25"/>
    </svg>
  );
}

/* ── main ─────────────────────────────────────────────────────── */

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [checkingIn, setCheckingIn] = useState(null);
  const [toast, setToast] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')); }
    catch { return new Set(); }
  });
  const [selectedMapEvent, setSelectedMapEvent] = useState(null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [now, setNow] = useState(new Date());
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [user] = useState({
    username: localStorage.getItem('username') || 'Student',
    user_type: localStorage.getItem('user_type') || 'student',
    email: localStorage.getItem('email') || '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadData();
    loadAnnouncements();
    const id = setInterval(loadAnnouncements, 15000);
    return () => clearInterval(id);
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, attendanceData] = await Promise.all([
        api.getEvents(),
        api.myAttendance(),
      ]);
      if (eventsData.events) setEvents(eventsData.events);
      if (attendanceData.attendance) setMyAttendance(attendanceData.attendance);
    } catch (err) {
      setEvents(mockEvents);
      setMyAttendance(mockAttendance);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await api.announcements();
      if (Array.isArray(data?.announcements)) setAnnouncements(data.announcements);
    } catch (err) {}
  };

  const dismissAnnouncement = (id) => {
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...next]));
  };

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      reject
    );
  });

  const handleCheckIn = async (eventId) => {
    setCheckingIn(eventId);
    try {
      const location = await getCurrentLocation();
      const result = await api.trackAttendance({
        event_id: eventId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (result && result.error) {
        showToast('error', result.error);
      } else if (result && result.checked_in) {
        showToast('success', result.message || `Checked in to ${result.event}`);
      } else if (result && result.checked_out) {
        showToast('success', result.message || 'Checked out successfully');
      } else if (result && result.is_inside === false) {
        const dist = result.distance_meters ? ` (${Math.round(result.distance_meters)}m away)` : '';
        showToast('error', `You are outside the event radius${dist}`);
      } else if (result && result.is_inside === true) {
        showToast('success', `You are inside ${result.event} · already checked in`);
      } else {
        showToast('success', 'Attendance recorded');
      }
      loadData();
    } catch (err) {
      const msg = err && err.code === 1
        ? 'Location permission denied. Enable GPS and retry.'
        : 'Could not get your location. Check GPS and connection.';
      showToast('error', msg);
      setTimeout(() => loadData(), 1200);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/logout/', { method: 'POST', credentials: 'include' }); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!selectedMapEvent && events.length > 0) {
      const active = events.find(e => e.is_active !== false) || events[0];
      setSelectedMapEvent(active);
    }
  }, [events, selectedMapEvent]);

  useEffect(() => {
    if (activeTab !== 'map' || !selectedMapEvent?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.presentStudents(selectedMapEvent.id);
        if (!cancelled && Array.isArray(data?.students)) setPresentStudents(data.students);
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeTab, selectedMapEvent]);

  useEffect(() => {
    if (activeTab !== 'map' && mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
      markersRef.current = [];
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'map' || !selectedMapEvent || !mapContainerRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;
    const L = window.L;
    const lat = parseFloat(selectedMapEvent.latitude);
    const lng = parseFloat(selectedMapEvent.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    if (mapRef.current && mapRef.current.getContainer && mapRef.current.getContainer() !== mapContainerRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
      markersRef.current = [];
    }

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 17);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(mapRef.current);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(mapRef.current);
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 17);
    }
    const map = mapRef.current;
    setTimeout(() => map.invalidateSize(), 100);

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const radius = L.circle([lat, lng], {
      radius: selectedMapEvent.radius || 100,
      color: ON_DARK,
      weight: 1,
      fillColor: ON_DARK,
      fillOpacity: 0.04,
    }).addTo(map);
    markersRef.current.push(radius);

    const centerMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="position:relative;width:20px;height:20px;">
                 <div style="position:absolute;inset:0;border:1px solid ${ON_DARK};border-radius:50%;"></div>
                 <div style="position:absolute;inset:6px;background:${ON_DARK};border-radius:50%;"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      }),
    }).addTo(map).bindPopup(`<b style="font-family:${SANS};font-weight:600;font-size:14px;color:#141412">${selectedMapEvent.name}</b>`);
    markersRef.current.push(centerMarker);

    presentStudents.forEach(s => {
      if (s.latitude == null || s.longitude == null) return;
      const marker = L.marker([s.latitude, s.longitude], {
        icon: L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${ON_DARK};border:1.5px solid ${DARK};"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
          className: '',
        }),
      }).addTo(map).bindPopup(
        `<div style="font-family:${SANS};font-size:12px;color:#141412"><b>${s.name || s.username}</b>${s.check_in_time ? '<br/><span style="color:#7a766d">' + new Date(s.check_in_time).toLocaleTimeString() + '</span>' : ''}</div>`
      );
      markersRef.current.push(marker);
    });
  }, [activeTab, selectedMapEvent, presentStudents]);

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
  }, []);

  /* mocks */
  const mockEvents = [
    { id: 1, name: 'Tech Innovation Summit', start_time: '2026-04-15T09:00:00', location: 'Main Auditorium', radius: 120, is_active: true },
    { id: 2, name: 'Leadership Workshop',    start_time: '2026-04-18T14:00:00', location: 'Conference Room A', radius: 80,  is_active: true },
    { id: 3, name: 'Networking Night',       start_time: '2026-04-20T18:00:00', location: 'Rooftop Lounge', radius: 100, is_active: true },
  ];
  const mockAttendance = [
    { id: 1, event: 'Orientation Day',   date: '2026-04-01', status: 'present', time: '09:15:02' },
    { id: 2, event: 'Coding Bootcamp',   date: '2026-04-05', status: 'present', time: '10:30:47' },
    { id: 3, event: 'Team Building',     date: '2026-04-08', status: 'absent',  time: null },
  ];
  const eventsList = events.length > 0 ? events : mockEvents;
  const attendanceList = myAttendance.length > 0 ? myAttendance : mockAttendance;

  const tabs = [
    { id: 'overview',   label: 'Overview',   num: '01' },
    { id: 'events',     label: 'Events',     num: '02' },
    { id: 'map',        label: 'Live Map',   num: '03' },
    { id: 'attendance', label: 'History',    num: '04' },
    { id: 'profile',    label: 'Account',    num: '05' },
  ];

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const longDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const totalAttended = attendanceList.filter(a => a.status === 'present').length;

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: GROUND,
        color: INK,
        fontFamily: SANS,
        fontFeatureSettings: '"ss01", "ss02"',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ══════════ TOP BAR (light) ══════════ */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: `${GROUND}ee`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${HAIR}`,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between gap-8">
          {/* Wordmark */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Logo size={32} />
            <span
              className="hidden sm:inline"
              style={{
                fontFamily: SANS,
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: INK,
              }}
            >
              360PRESENCE
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-9">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="group relative flex items-baseline gap-2 pb-[6px]"
                  style={{ color: active ? INK : MUTED }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = INK; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = MUTED; }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em' }}>{tab.num}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {tab.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="topRule"
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px]"
                      style={{ backgroundColor: INK }}
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="hidden md:flex flex-col items-end leading-none">
              <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: '0.02em' }}>
                {timeStr}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
                {dateStr}
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center"
              style={{ border: `1px solid ${HAIR_2}` }}
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1">
                <span className="block w-4 h-[1.5px]" style={{ backgroundColor: INK }} />
                <span className="block w-4 h-[1.5px]" style={{ backgroundColor: INK }} />
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="hidden lg:flex items-center gap-3"
              style={{ color: INK }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center"
                style={{
                  backgroundColor: INK,
                  color: GROUND,
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {(user.username || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: INK }}>{user.username}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
                  Student
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════ MOBILE DRAWER ══════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: 'rgba(11,12,10,0.55)' }}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: EASE, duration: 0.45 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[320px] lg:hidden flex flex-col"
              style={{ backgroundColor: GROUND, borderLeft: `1px solid ${HAIR_2}` }}
            >
              <div className="h-[68px] flex items-center justify-between px-6" style={{ borderBottom: `1px solid ${HAIR}` }}>
                <Logo size={28} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ border: `1px solid ${HAIR_2}`, fontFamily: SANS, fontSize: 18, color: INK }}
                  aria-label="Close"
                >×</button>
              </div>
              <nav className="flex-1 py-5">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className="w-full text-left flex items-baseline gap-5 px-6 py-5"
                      style={{
                        borderBottom: `1px solid ${HAIR}`,
                        color: active ? INK : MUTED,
                      }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em' }}>{tab.num}</span>
                      <span style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-6" style={{ borderTop: `1px solid ${HAIR}` }}>
                <button
                  onClick={handleLogout}
                  style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED }}
                >
                  Sign out →
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ CONTENT ══════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {/* ─── HERO (dark, full-bleed) ─── */}
          <section
            className="w-full"
            style={{ backgroundColor: DARK, color: ON_DARK, borderBottom: `1px solid ${DARK_HAIR}` }}
          >
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-16 pb-14 lg:pt-24 lg:pb-20 min-h-[560px] flex flex-col justify-between">
              {/* Top row inside hero: label/meta */}
              <div className="flex items-start justify-between gap-8 mb-20">
                <div className="flex items-center gap-4">
                  <Label dark>§ {tabs.find(t => t.id === activeTab)?.num || '01'}</Label>
                  <span className="h-px w-16" style={{ backgroundColor: DARK_HAIR2 }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ON_DARK_2 }}>
                    {tabs.find(t => t.id === activeTab)?.label}
                  </span>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ON_DARK_M }}>
                    {longDate}
                  </div>
                  <div className="mt-2 tabular-nums" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.04em', color: ON_DARK_2 }}>
                    {timeStr} · {user.username}
                  </div>
                </div>
              </div>

              {/* Hero title */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-16 items-end">
                <h1
                  className="tracking-tight"
                  style={{
                    fontFamily: SANS,
                    fontSize: 'clamp(56px, 9vw, 136px)',
                    fontWeight: 500,
                    lineHeight: 0.94,
                    letterSpacing: '-0.025em',
                    color: ON_DARK,
                  }}
                >
                  {activeTab === 'overview'   && <>Welcome back,<br/>{user.username}.</>}
                  {activeTab === 'events'     && <>Assemblies<br/>ahead.</>}
                  {activeTab === 'map'        && <>Who is here,<br/>right now.</>}
                  {activeTab === 'attendance' && <>The full<br/>record.</>}
                  {activeTab === 'profile'    && <>{user.username}<br/>on file.</>}
                </h1>
                <div className="max-w-md lg:pb-6">
                  <p style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 500, color: ON_DARK_2, lineHeight: 1.55 }}>
                    {activeTab === 'overview'   && 'A live log of every assembly you step into — stamped by geofence, sealed by the second. Your complete attendance ledger, updated in real time.'}
                    {activeTab === 'events'     && 'The gatherings that will be measured next. Check in automatically the moment you cross the radius, and leave without a second thought.'}
                    {activeTab === 'map'        && 'Every student inside the event perimeter, plotted in real time. Watch the assembly take shape, person by person, as they arrive.'}
                    {activeTab === 'attendance' && 'Every entry and exit you have ever made, preserved on the record and sortable by event, date, and duration inside the radius.'}
                    {activeTab === 'profile'    && 'Your identity on the record. Operator handle, role, account status, and everything the ledger knows about you.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── ANNOUNCEMENTS (light band right below hero) ─── */}
          {visibleAnnouncements.length > 0 && (
            <section style={{ backgroundColor: GROUND_2, borderBottom: `1px solid ${HAIR}` }}>
              <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
                {visibleAnnouncements.map((a, idx) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-6 py-3"
                    style={{ borderTop: idx === 0 ? 'none' : `1px solid ${HAIR}` }}
                  >
                    <Label className="flex-shrink-0 pt-1">Notice</Label>
                    <p className="flex-1" style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: INK, lineHeight: 1.5 }}>
                      {a.message}
                    </p>
                    {a.created_at && (
                      <span className="tabular-nums pt-1" style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.04em' }}>
                        {new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => dismissAnnouncement(a.id)}
                      className="w-6 h-6 flex items-center justify-center flex-shrink-0 pt-0.5"
                      style={{ fontFamily: SANS, fontSize: 18, color: MUTED }}
                      aria-label="Dismiss"
                    >×</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <>
              {/* Split intro */}
              <section className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-24 items-start">
                  <div className="flex items-center gap-4">
                    <Label>01 / Status</Label>
                  </div>
                  <div>
                    <p style={{ fontFamily: SANS, fontSize: 'clamp(22px, 2.2vw, 32px)', fontWeight: 600, letterSpacing: '-0.015em', color: INK, lineHeight: 1.25 }}>
                      You have attended <span style={{ color: INK }}>{totalAttended}</span> of <span style={{ color: MUTED }}>{eventsList.length}</span> tracked assemblies this cycle. Your standing is nominal and your GPS signal is live.
                    </p>
                    <div className="mt-6">
                      <InlineLink onClick={() => setActiveTab('events')}>Review upcoming events</InlineLink>
                    </div>
                  </div>
                </div>
              </section>

              {/* Stats strip */}
              <section className="max-w-[1600px] mx-auto px-6 lg:px-10 pb-20">
                <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
                  {[
                    { n: '01', k: 'Events Attended', v: pad2(totalAttended), sub: 'This cycle' },
                    { n: '02', k: 'Attendance Rate', v: '100', sub: '— Top 5 percentile' },
                    { n: '03', k: 'Upcoming',        v: pad2(eventsList.length), sub: 'Next assemblies' },
                    { n: '04', k: 'Live Now',        v: '02', sub: 'In your radius' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="py-10 lg:py-12 px-5 lg:px-8 flex flex-col"
                      style={{
                        borderLeft: i === 0 ? 'none' : `1px solid ${HAIR}`,
                        borderTop: i >= 2 ? `1px solid ${HAIR}` : 'none',
                        minHeight: 220,
                      }}
                    >
                      <div className="flex items-baseline gap-3 mb-auto">
                        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: MUTED }}>{s.n}</span>
                        <Label>{s.k}</Label>
                      </div>
                      <div
                        className="tabular-nums"
                        style={{
                          fontFamily: SANS,
                          fontSize: 'clamp(56px, 6.5vw, 96px)',
                          fontWeight: 500,
                          letterSpacing: '-0.035em',
                          lineHeight: 0.9,
                          marginTop: 36,
                        }}
                      >
                        {s.v}
                      </div>
                      <div className="mt-3" style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {s.sub}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Next up preview */}
              <section className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-4 pb-28">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <Label>02 / Next on record</Label>
                    <span className="h-px w-24" style={{ backgroundColor: HAIR }} />
                  </div>
                  <InlineLink onClick={() => setActiveTab('events')}>View all {pad2(eventsList.length)}</InlineLink>
                </div>
                {eventsList[0] && (
                  <EventCard event={eventsList[0]} index={0} busy={checkingIn === eventsList[0].id} onCheckIn={handleCheckIn} featured />
                )}
              </section>
            </>
          )}

          {/* ─── EVENTS ─── */}
          {activeTab === 'events' && (
            <section className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <Label>02 / Upcoming</Label>
                  <span className="h-px w-24" style={{ backgroundColor: HAIR }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {pad2(eventsList.length)} listed
                  </span>
                </div>
              </div>
              <div className="space-y-0" style={{ borderTop: `1px solid ${INK}` }}>
                {eventsList.map((event, i) => (
                  <EventCard
                    key={event.id || i}
                    event={event}
                    index={i}
                    busy={checkingIn === event.id}
                    onCheckIn={handleCheckIn}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── MAP (dark full-bleed frame) ─── */}
          {activeTab === 'map' && (
            <section
              className="w-full"
              style={{ backgroundColor: DARK, color: ON_DARK, borderBottom: `1px solid ${DARK_HAIR}` }}
            >
              <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-16 pb-24">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                  <div className="flex items-center gap-4">
                    <Label dark>03 / Live Presence</Label>
                    <span className="h-px w-20" style={{ backgroundColor: DARK_HAIR2 }} />
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: ON_DARK_M, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      {pad2(presentStudents.length)} souls inside radius
                    </span>
                  </div>
                  {eventsList.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedMapEvent?.id || ''}
                        onChange={(e) => {
                          const ev = eventsList.find(x => String(x.id) === e.target.value);
                          setSelectedMapEvent(ev || null);
                        }}
                        className="appearance-none h-11 pl-4 pr-10"
                        style={{
                          fontFamily: MONO,
                          fontSize: 10.5,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: ON_DARK,
                          backgroundColor: 'transparent',
                          border: `1px solid ${DARK_HAIR2}`,
                          minWidth: 240,
                        }}
                      >
                        {eventsList.map(ev => (
                          <option key={ev.id} value={ev.id} style={{ backgroundColor: DARK, color: ON_DARK }}>{ev.name}</option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ON_DARK_2, fontSize: 10 }}>▾</span>
                    </div>
                  )}
                </div>

                {selectedMapEvent ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]" style={{ border: `1px solid ${DARK_HAIR2}` }}>
                    <div style={{ borderRight: `1px solid ${DARK_HAIR2}` }}>
                      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${DARK_HAIR2}` }}>
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ON_DARK_M }}>
                            Fig. 01
                          </div>
                          <div className="mt-1" style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', color: ON_DARK }}>
                            {selectedMapEvent.name}
                          </div>
                        </div>
                        <div className="text-right" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ON_DARK_M }}>
                          {parseFloat(selectedMapEvent.latitude).toFixed(4)}° N<br/>
                          {parseFloat(selectedMapEvent.longitude).toFixed(4)}° E<br/>
                          R {selectedMapEvent.radius || 100}m
                        </div>
                      </div>
                      <div ref={mapContainerRef} style={{ height: 580, width: '100%', backgroundColor: DARK_2 }} />
                    </div>

                    <div className="flex flex-col">
                      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${DARK_HAIR2}` }}>
                        <Label dark>Present Now</Label>
                        <div
                          className="tabular-nums mt-2"
                          style={{ fontFamily: SANS, fontSize: 72, fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 0.9, color: ON_DARK }}
                        >
                          {pad2(presentStudents.length)}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
                        {presentStudents.length === 0 ? (
                          <div className="px-6 py-12" style={{ fontFamily: SANS, fontSize: 15, color: ON_DARK_M, lineHeight: 1.5 }}>
                            The radius is empty. No one has crossed in yet.
                          </div>
                        ) : (
                          presentStudents.map((s, i) => (
                            <motion.div
                              key={s.id || s.username || i}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, ease: EASE }}
                              className="flex items-center gap-4 px-6 py-4"
                              style={{ borderBottom: `1px solid ${DARK_HAIR}` }}
                            >
                              <span className="tabular-nums flex-shrink-0" style={{ fontFamily: MONO, fontSize: 10, color: ON_DARK_M, letterSpacing: '0.08em', minWidth: 24 }}>
                                {pad2(i + 1)}
                              </span>
                              <span className="flex-1 truncate" style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: ON_DARK }}>
                                {s.name || s.username}
                              </span>
                              <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 10.5, color: ON_DARK_2, letterSpacing: '0.04em' }}>
                                {s.check_in_time ? new Date(s.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="py-16 text-center" style={{ fontFamily: SANS, fontSize: 18, color: ON_DARK_M }}>No events to map.</p>
                )}
              </div>
            </section>
          )}

          {/* ─── ATTENDANCE ─── */}
          {activeTab === 'attendance' && (
            <section className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-32">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <Label>04 / Historical record</Label>
                  <span className="h-px w-24" style={{ backgroundColor: HAIR }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {pad3(attendanceList.length)} entries on file
                  </span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
                <div
                  className="hidden sm:grid grid-cols-[70px_1fr_150px_130px_130px] gap-6 px-5 py-4"
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: MUTED,
                    borderBottom: `1px solid ${HAIR}`,
                  }}
                >
                  <span>No.</span>
                  <span>Event</span>
                  <span>Date</span>
                  <span>Check-in</span>
                  <span className="text-right">Status</span>
                </div>
                {attendanceList.map((record, i) => (
                  <AttendanceRow key={record.id || i} record={record} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ─── PROFILE (split dark/light) ─── */}
          {activeTab === 'profile' && (
            <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]" style={{ borderBottom: `1px solid ${HAIR}` }}>
              {/* Dark left — portrait */}
              <div
                className="px-6 lg:px-10 py-20 lg:py-32 flex flex-col justify-between"
                style={{ backgroundColor: DARK, color: ON_DARK, minHeight: 640 }}
              >
                <Label dark>05 / Name of record</Label>
                <div>
                  <h2
                    style={{
                      fontFamily: SANS,
                      fontSize: 'clamp(72px, 10vw, 168px)',
                      fontWeight: 500,
                      letterSpacing: '-0.035em',
                      lineHeight: 0.88,
                      color: ON_DARK,
                    }}
                  >
                    {user.username}.
                  </h2>
                  <p
                    className="mt-8 max-w-md"
                    style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: ON_DARK_2, lineHeight: 1.55 }}
                  >
                    Member of the record since April 2026. Every assembly you attend is stamped, sealed, and kept in this ledger.
                  </p>
                </div>
              </div>

              {/* Light right — details */}
              <div className="px-6 lg:px-10 py-16 lg:py-24 flex flex-col">
                <Label className="mb-10">Details</Label>
                <dl className="space-y-0">
                  {[
                    { k: 'Username',     v: user.username },
                    { k: 'Role',         v: user.user_type, mono: false },
                    { k: 'Email',        v: user.email || `${user.username.toLowerCase()}@360presence.local`, mono: true },
                    { k: 'Member since', v: 'April 2026' },
                    { k: 'Time zone',    v: Intl.DateTimeFormat().resolvedOptions().timeZone, mono: true },
                    { k: 'Record ID',    v: `#${pad3(user.username.length * 7 + 12)}`, mono: true },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-6 py-5"
                      style={{ borderBottom: `1px solid ${HAIR}` }}
                    >
                      <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, minWidth: 100 }}>
                        {row.k}
                      </dt>
                      <dd
                        className="flex-1 text-right tabular-nums"
                        style={{
                          fontFamily: row.mono ? MONO : SANS,
                          fontSize: row.mono ? 13 : 18,
                          fontWeight: row.mono ? 400 : 600,
                          letterSpacing: row.mono ? '0.02em' : '-0.01em',
                          color: INK,
                        }}
                      >
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={handleLogout}
                  className="group mt-12 inline-flex items-baseline gap-3 self-start pb-[3px]"
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: INK,
                    borderBottom: `1px solid ${INK}`,
                  }}
                >
                  Sign out of the record
                  <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>→</motion.span>
                </button>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ══════════ FOOTER (dark) ══════════ */}
      <footer style={{ backgroundColor: DARK, color: ON_DARK }}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-20 pb-10">
          <div className="flex flex-wrap items-start justify-between gap-16 pb-16">
            <div>
              <Logo size={72} dark />
              <div className="mt-6" style={{ fontFamily: SANS, fontSize: 52, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 0.9, color: ON_DARK }}>
                360Presence
              </div>
              <div className="mt-4" style={{ fontFamily: MONO, fontSize: 10.5, color: ON_DARK_M, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Attendance, without a pen.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-16 lg:gap-24" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: ON_DARK_2 }}>
              <div className="space-y-3">
                <div style={{ color: ON_DARK_M }}>System</div>
                <div>v1.0</div>
                <div>Live</div>
                <div>Geofence</div>
              </div>
              <div className="space-y-3">
                <div style={{ color: ON_DARK_M }}>Bureau</div>
                <div>Est. 2026</div>
                <div>Philippines</div>
                <div>Students &amp; Staff</div>
              </div>
            </div>
          </div>
          <div
            className="pt-8 flex flex-wrap items-center justify-between gap-4"
            style={{ borderTop: `1px solid ${DARK_HAIR2}`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ON_DARK_M }}
          >
            <span>© MMXXVI · The Presence Bureau</span>
            <span>Reg. №. 360-{pad3(new Date().getFullYear() % 100)}</span>
            <span>Set in Hanken Grotesk &amp; Geist Mono</span>
          </div>
        </div>
      </footer>

      {/* ══════════ TOAST ══════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ ease: EASE, duration: 0.35 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-32px)]"
          >
            <div
              className="flex items-start gap-5 px-6 py-5 min-w-[340px]"
              style={{
                backgroundColor: toast.type === 'success' ? INK : DARK,
                color: ON_DARK,
                border: `1px solid ${toast.type === 'success' ? INK : DARK_HAIR2}`,
                boxShadow: '0 20px 60px rgba(20,20,18,0.25)',
              }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{
                  border: `1px solid ${ON_DARK_2}`,
                  fontFamily: MONO,
                  fontSize: 13,
                  color: ON_DARK,
                }}
              >
                {toast.type === 'success' ? '✓' : '✕'}
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ON_DARK_M, marginBottom: 4 }}>
                  {toast.type === 'success' ? 'Success' : 'Failed'}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: ON_DARK, lineHeight: 1.35 }}>
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                style={{ fontFamily: SANS, fontSize: 16, color: ON_DARK_M }}
                aria-label="Dismiss"
              >×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── EventCard sub-component ──────────────────────────────────── */

function EventCard({ event, index, busy, onCheckIn, featured = false }) {
  const [hover, setHover] = useState(false);
  const d = event.start_time ? new Date(event.start_time) : null;
  const dateLabel = d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase() : '—';
  const timeLabel = d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
  const isLive = event.is_active !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: EASE, duration: 0.6 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative transition-colors duration-500"
      style={{
        borderBottom: `1px solid ${HAIR}`,
        backgroundColor: hover ? GROUND_2 : 'transparent',
      }}
    >
      <div
        className={`grid grid-cols-1 lg:grid-cols-[120px_1fr_auto] gap-6 lg:gap-12 items-center transition-all duration-500 ${featured ? 'py-10 lg:py-14' : 'py-8 lg:py-10'}`}
        style={{
          paddingLeft: hover ? 20 : 0,
          paddingRight: hover ? 20 : 0,
        }}
      >
        {/* Left: number + date */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.12em' }}>
            {pad2(index + 1)}
          </div>
          <div
            className="tabular-nums mt-2"
            style={{
              fontFamily: SANS,
              fontSize: featured ? 44 : 34,
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: INK,
              lineHeight: 1,
            }}
          >
            {dateLabel}
          </div>
          <div className="mt-2 tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>
            {timeLabel}
          </div>
        </div>

        {/* Middle: title + meta */}
        <div className="flex-1 min-w-0">
          <h3
            style={{
              fontFamily: SANS,
              fontSize: featured ? 'clamp(34px, 4.5vw, 64px)' : 'clamp(26px, 3vw, 44px)',
              fontWeight: 500,
              letterSpacing: '-0.025em',
              lineHeight: 1,
              color: INK,
            }}
          >
            {event.name}
          </h3>
          <dl
            className="flex flex-wrap gap-x-10 gap-y-2 mt-5"
            style={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            <div className="flex gap-2">
              <dt>Venue</dt>
              <dd style={{ color: INK_2 }}>{event.location || 'TBD'}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Radius</dt>
              <dd style={{ color: INK_2 }}>{event.radius || 100}m</dd>
            </div>
            <div className="flex gap-2">
              <dt>Status</dt>
              <dd style={{ color: isLive ? INK : MUTED }}>{isLive ? '● Open' : '○ Closed'}</dd>
            </div>
          </dl>
        </div>

        {/* Right: action */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => isLive && !busy && onCheckIn(event.id)}
            disabled={!isLive || busy}
            className="group/btn inline-flex items-baseline gap-3 pb-[3px] disabled:opacity-40"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: INK,
              borderBottom: `1px solid ${INK}`,
            }}
          >
            {busy ? 'Stamping…' : 'Check in'}
            <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>→</motion.span>
          </button>
          <PlusButton />
        </div>
      </div>
    </motion.div>
  );
}

function AttendanceRow({ record, index }) {
  const [hover, setHover] = useState(false);
  const present = record.status === 'present';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ease: EASE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="grid grid-cols-[60px_1fr_90px] sm:grid-cols-[70px_1fr_150px_130px_130px] gap-6 px-5 py-5 items-baseline transition-colors duration-300"
      style={{
        borderBottom: `1px solid ${HAIR}`,
        backgroundColor: hover ? GROUND_2 : 'transparent',
      }}
    >
      <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>
        {pad3(index + 1)}
      </span>
      <span
        className="truncate"
        style={{ fontFamily: SANS, fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 600, letterSpacing: '-0.015em', color: INK, lineHeight: 1.1 }}
      >
        {record.event}
      </span>
      <span className="hidden sm:inline tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: INK_2, letterSpacing: '0.04em' }}>
        {record.date}
      </span>
      <span className="hidden sm:inline tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: record.time ? INK_2 : MUTED_2, letterSpacing: '0.04em' }}>
        {record.time || '—'}
      </span>
      <span
        className="text-right"
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: present ? INK : MUTED,
        }}
      >
        {present ? '● Present' : '○ Absent'}
      </span>
    </motion.div>
  );
}
