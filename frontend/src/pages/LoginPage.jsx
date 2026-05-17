import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const GROUND = '#f4f3ef';
const GROUND_2 = '#eceae4';
const HAIR = '#dcd9cf';
const HAIR_2 = '#c6c3b7';
const INK = '#141412';
const INK_2 = '#2a2a26';
const MUTED = '#7a766d';
const MUTED_2 = '#a9a59a';
const DARK = '#0b0c0a';
const DARK_2 = '#141410';
const DARK_HAIR = '#22221e';
const ON_DARK = '#f4f3ef';
const ON_DARK_2 = '#c6c3b7';
const ON_DARK_M = '#7a766d';

const SANS = "'Hanken Grotesk', -apple-system, system-ui, sans-serif";
const INTER = "'Inter', -apple-system, system-ui, sans-serif";

const EASE = [0.22, 1, 0.36, 1];

function Logo({ size = 48, color = INK }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="39" height="39" stroke={color} strokeWidth="1.25" />
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="1.25" />
      <circle cx="20" cy="20" r="5" stroke={color} strokeWidth="1.25" />
      <circle cx="20" cy="20" r="1.5" fill={color} />
      <line x1="20" y1="4" x2="20" y2="9" stroke={color} strokeWidth="1.25" />
      <line x1="20" y1="31" x2="20" y2="36" stroke={color} strokeWidth="1.25" />
      <line x1="4" y1="20" x2="9" y2="20" stroke={color} strokeWidth="1.25" />
      <line x1="31" y1="20" x2="36" y2="20" stroke={color} strokeWidth="1.25" />
    </svg>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await api.login({ username, password });
        if (data.success) {
          localStorage.setItem('token', data.token || 'session-active');
          localStorage.setItem('user_type', data.user_type);
          localStorage.setItem('username', data.username);
          localStorage.setItem('full_name', data.full_name || data.username);
          navigate('/dashboard');
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        const data = await api.register({ firstName, lastName, username, email, password });
        if (data.success) {
          setIsLogin(true);
          setError('');
          setPassword('');
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Connection error. Please ensure Django server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: GROUND, fontFamily: SANS, WebkitFontSmoothing: 'antialiased' }}
    >
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-md"
        >
          <div
            className="rounded-2xl p-10 sm:p-12"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${HAIR}`,
            }}
          >
            {/* Brand */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="inline-block mb-5"
              >
                <Logo size={56} color={INK} />
              </motion.div>
              <h1
                style={{
                  fontFamily: SANS,
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: INK,
                }}
              >
                360Presence
              </h1>
              <p
                style={{
                  fontFamily: INTER,
                  fontSize: 15,
                  fontWeight: 500,
                  color: MUTED,
                  marginTop: 8,
                }}
              >
                {isLogin ? 'Student Login' : 'Create Account'}
              </p>
            </div>

            {/* Toggle */}
            <div
              className="flex rounded-xl p-1 mb-8"
              style={{ backgroundColor: GROUND }}
            >
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  fontFamily: INTER,
                  backgroundColor: isLogin ? INK : 'transparent',
                  color: isLogin ? GROUND : MUTED,
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  fontFamily: INTER,
                  backgroundColor: !isLogin ? INK : 'transparent',
                  color: !isLogin ? GROUND : MUTED,
                }}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  {/* Name fields (register only) */}
                  {!isLogin && (
                    <div className="flex gap-4 mb-5">
                      <div className="flex-1">
                        <label
                          className="block mb-2"
                          style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: INK }}
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Juan"
                          required
                          className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
                          style={{
                            fontFamily: INTER,
                            fontSize: 16,
                            border: `1.5px solid ${HAIR}`,
                            backgroundColor: GROUND,
                            color: INK,
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = INK;
                            e.target.style.backgroundColor = 'white';
                            e.target.style.boxShadow = `0 0 0 3px rgba(20, 20, 18, 0.08)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = HAIR;
                            e.target.style.backgroundColor = GROUND;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          className="block mb-2"
                          style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: INK }}
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Dela Cruz"
                          required
                          className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
                          style={{
                            fontFamily: INTER,
                            fontSize: 16,
                            border: `1.5px solid ${HAIR}`,
                            backgroundColor: GROUND,
                            color: INK,
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = INK;
                            e.target.style.backgroundColor = 'white';
                            e.target.style.boxShadow = `0 0 0 3px rgba(20, 20, 18, 0.08)`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = HAIR;
                            e.target.style.backgroundColor = GROUND;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  <div className="mb-5">
                    <label
                      className="block mb-2"
                      style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: INK }}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
                      style={{
                        fontFamily: INTER,
                        fontSize: 16,
                        border: `1.5px solid ${HAIR}`,
                        backgroundColor: GROUND,
                        color: INK,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = INK;
                        e.target.style.backgroundColor = 'white';
                        e.target.style.boxShadow = `0 0 0 3px rgba(20, 20, 18, 0.08)`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = HAIR;
                        e.target.style.backgroundColor = GROUND;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Email (register only) */}
                  {!isLogin && (
                    <motion.div
                      className="mb-5"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <label
                        className="block mb-2"
                        style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: INK }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
                        style={{
                          fontFamily: INTER,
                          fontSize: 16,
                          border: `1.5px solid ${HAIR}`,
                          backgroundColor: GROUND,
                          color: INK,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = INK;
                          e.target.style.backgroundColor = 'white';
                          e.target.style.boxShadow = `0 0 0 3px rgba(20, 20, 18, 0.08)`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = HAIR;
                          e.target.style.backgroundColor = GROUND;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </motion.div>
                  )}

                  {/* Password */}
                  <div className="mb-6">
                    <label
                      className="block mb-2"
                      style={{ fontFamily: INTER, fontSize: 14, fontWeight: 600, color: INK }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full px-4 py-3.5 pr-12 rounded-xl transition-all duration-200"
                        style={{
                          fontFamily: INTER,
                          fontSize: 16,
                          border: `1.5px solid ${HAIR}`,
                          backgroundColor: GROUND,
                          color: INK,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = INK;
                          e.target.style.backgroundColor = 'white';
                          e.target.style.boxShadow = `0 0 0 3px rgba(20, 20, 18, 0.08)`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = HAIR;
                          e.target.style.backgroundColor = GROUND;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: MUTED }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 px-4 py-3 rounded-xl text-center"
                    style={{
                      fontFamily: INTER,
                      fontSize: 14,
                      fontWeight: 500,
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  fontFamily: INTER,
                  fontSize: 16,
                  backgroundColor: INK,
                  color: GROUND,
                }}
                onMouseEnter={(e) => { if (!e.target.disabled) e.target.style.backgroundColor = INK_2; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = INK; }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Links */}
            <div
              className="mt-8 text-center"
              style={{ fontFamily: INTER, fontSize: 14, color: MUTED }}
            >
              {isLogin ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    style={{ color: INK, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${HAIR_2}` }}
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    style={{ color: INK, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${HAIR_2}` }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
            style={{ fontFamily: INTER, fontSize: 13, color: MUTED_2 }}
          >
            © 2026 · The Presence Bureau
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
