import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getInitials(email: string): string {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

/* ─── Animated gradient orbs (CSS only) ─── */
function GradientOrbs() {
  return (
    <>
      <div
        className="absolute rounded-full blur-3xl opacity-40 animate-pulse"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #FF8C5A 0%, transparent 70%)',
          top: '10%',
          left: '20%',
          animationDuration: '4s',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-30 animate-pulse"
        style={{
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, #B98BFF 0%, transparent 70%)',
          bottom: '15%',
          right: '15%',
          animationDuration: '5s',
          animationDelay: '1s',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-20 animate-pulse"
        style={{
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, #36CFC9 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          animationDuration: '6s',
          animationDelay: '2s',
        }}
      />
    </>
  );
}

/* ─── Floating particles ─── */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0.3; }
          100% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

/* ─── Google icon SVG ─── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, register, signInWithGoogle, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const resetForm = () => {
    setErrors({});
    setGlobalError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!validateEmail(email)) newErrors.email = 'Ungültiges E-Mail-Format';
    if (!password) newErrors.password = 'Passwort ist erforderlich';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await login(email, password);
    if (error) {
      setGlobalError(error.message === 'Invalid login credentials'
        ? 'Ungültige Anmeldedaten'
        : error.message
      );
    } else {
      navigate('/');
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Name ist erforderlich';
    if (!email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!validateEmail(email)) newErrors.email = 'Ungültiges E-Mail-Format';
    if (!password) newErrors.password = 'Passwort ist erforderlich';
    else if (password.length < 8) newErrors.password = 'Mindestens 8 Zeichen';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await register(email, password, fullName);
    if (error) {
      setGlobalError(error.message);
    } else {
      setSuccessMessage('Überprüfe deine E-Mail!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
    }
    setIsSubmitting(false);
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  // Derived: show user's initial avatar when logged in
  const userInitial = email ? getInitials(email) : '';

  return (
    <div className="flex min-h-[100dvh] bg-black">
      {/* ─── LEFT SIDE ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{ backgroundColor: '#0C0D0F' }}
      >
        <GradientOrbs />
        <Particles />

        <div className="relative z-10 text-center px-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="loopGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8C5A" />
                  <stop offset="100%" stopColor="#B98BFF" />
                </linearGradient>
              </defs>
              <path
                d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.418 0 8.235-2.388 10.303-5.94"
                stroke="url(#loopGradLogin)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="16" cy="16" r="4" fill="#FF8C5A" />
            </svg>
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              Loop Studio OS
            </span>
          </div>

          <p className="text-lg" style={{ color: '#A1A4AA' }}>
            Dein Business-Dashboard
          </p>

          {/* Decorative avatar */}
          <div className="mt-10 flex justify-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              {userInitial || 'LS'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,140,90,0.08) 0%, transparent 60%)',
          }}
        />

        <div
          className="relative z-10 w-full max-w-[420px] rounded-2xl p-8"
          style={{
            backgroundColor: '#0C0D0F',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Tab Switcher */}
          <div
            className="flex rounded-lg p-1 mb-8"
            style={{ backgroundColor: '#1B1D20' }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('login'); resetForm(); }}
              className="flex-1 relative py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                color: activeTab === 'login' ? '#FFFFFF' : '#5E626A',
                backgroundColor: activeTab === 'login' ? '#141518' : 'transparent',
              }}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); resetForm(); }}
              className="flex-1 relative py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                color: activeTab === 'register' ? '#FFFFFF' : '#5E626A',
                backgroundColor: activeTab === 'register' ? '#141518' : 'transparent',
              }}
            >
              Registrieren
            </button>
          </div>

          {/* Global messages */}
          {globalError && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
            >
              {globalError}
            </div>
          )}
          {successMessage && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(54, 207, 201, 0.1)', color: '#36CFC9' }}
            >
              {successMessage}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@firma.de"
                      className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#1B1D20',
                        border: `1px solid ${errors.email ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: '#FFFFFF',
                      }}
                      onFocus={(e) => {
                        if (!errors.email) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                      }}
                      onBlur={(e) => {
                        if (!errors.email) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    />
                    {errors.email && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      Passwort
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 rounded-lg px-4 pr-11 text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#1B1D20',
                          border: `1px solid ${errors.password ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: '#FFFFFF',
                        }}
                        onFocus={(e) => {
                          if (!errors.password) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                        }}
                        onBlur={(e) => {
                          if (!errors.password) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#5E626A' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.password}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FF8C5A, #FFB347)',
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Wird angemeldet...' : 'Anmelden'}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
                  <span className="text-xs" style={{ color: '#5E626A' }}>oder mit Google</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full h-11 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: '#1B1D20',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#141518';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1B1D20';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <GoogleIcon />
                  Mit Google anmelden
                </button>

                {/* Forgot password */}
                <p className="text-center mt-6 text-xs" style={{ color: '#5E626A' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        setErrors({ email: 'Gib zuerst deine E-Mail ein' });
                        return;
                      }
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setErrors({ email: 'Ungültiges E-Mail-Format' });
                        return;
                      }
                      setIsSubmitting(true);
                      const { error } = await resetPassword(email);
                      if (error) {
                        setGlobalError(error.message);
                      } else {
                        setSuccessMessage('Passwort-Reset-Link gesendet!');
                      }
                      setIsSubmitting(false);
                    }}
                    className="underline hover:no-underline transition-colors"
                    style={{ color: '#A1A4AA' }}
                  >
                    Passwort vergessen?
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      Voller Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Max Mustermann"
                      className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#1B1D20',
                        border: `1px solid ${errors.fullName ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: '#FFFFFF',
                      }}
                      onFocus={(e) => {
                        if (!errors.fullName) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                      }}
                      onBlur={(e) => {
                        if (!errors.fullName) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    />
                    {errors.fullName && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@firma.de"
                      className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#1B1D20',
                        border: `1px solid ${errors.email ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: '#FFFFFF',
                      }}
                      onFocus={(e) => {
                        if (!errors.email) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                      }}
                      onBlur={(e) => {
                        if (!errors.email) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    />
                    {errors.email && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      Passwort
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindestens 8 Zeichen"
                        className="w-full h-11 rounded-lg px-4 pr-11 text-sm outline-none transition-all"
                        style={{
                          backgroundColor: '#1B1D20',
                          border: `1px solid ${errors.password ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: '#FFFFFF',
                        }}
                        onFocus={(e) => {
                          if (!errors.password) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                        }}
                        onBlur={(e) => {
                          if (!errors.password) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#5E626A' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A4AA' }}>
                      Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#1B1D20',
                        border: `1px solid ${errors.confirmPassword ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: '#FFFFFF',
                      }}
                      onFocus={(e) => {
                        if (!errors.confirmPassword) e.currentTarget.style.borderColor = 'rgba(255, 140, 90, 0.3)';
                      }}
                      onBlur={(e) => {
                        if (!errors.confirmPassword) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FF8C5A, #FFB347)',
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Wird registriert...' : 'Registrieren'}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

