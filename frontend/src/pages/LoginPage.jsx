import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { LogIn, User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function FloatingOrb({ position, color, speed }) {
  const meshRef = useRef(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 2;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * speed * 0.7) * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

function Particles() {
  const particlesRef = useRef(null);
  const count = 200;
  
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#00f5ff" transparent opacity={0.6} />
    </points>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
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
          
          navigate('/dashboard');
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        const data = await api.register({ username, email, password });
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
    <div className="min-h-screen relative overflow-hidden bg-dark-bg">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <FloatingOrb position={[-3, 2, -2]} color="#00f5ff" speed={0.3} />
          <FloatingOrb position={[3, -2, -3]} color="#bf00ff" speed={0.2} />
          <FloatingOrb position={[0, 3, -4]} color="#ff006e" speed={0.4} />
          <Particles />
        </Canvas>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(191, 0, 255, 0.2))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Sparkles className="w-10 h-10 text-neon-blue" />
            </motion.div>
            <h1 className="text-5xl font-bold mb-4 gradient-text">360Presence</h1>
            <p className="text-gray-400 text-lg">Next-generation attendance tracking</p>
          </div>

          <motion.div
            className="glass rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: 'rgba(10, 10, 15, 0.8)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            whileHover={{ boxShadow: '0 0 60px rgba(0, 245, 255, 0.1)' }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1) 0%, rgba(191, 0, 255, 0.1) 100%)',
              }}
            />

            <div className="relative">
              <div className="flex mb-8 rounded-xl p-1" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isLogin ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white' : 'text-gray-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    !isLogin ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white' : 'text-gray-400'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field pl-12"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </motion.div>

                {!isLogin && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-12"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: isLogin ? 0.3 : 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-12 pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center py-2 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-500 text-sm mt-6"
          >
            Experience the future of attendance tracking
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
