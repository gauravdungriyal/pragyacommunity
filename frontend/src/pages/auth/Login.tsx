import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@pragya.org');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (res.status) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Unable to connect to server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-neutral-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-sand-200 dark:border-neutral-800">
        
        {/* Left Hero Graphic Section */}
        <div className="lg:col-span-6 bg-gradient-to-br from-forest-600 via-forest-700 to-forest-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-forest-950/40 blur-3xl" />

          {/* Brand Logo & Name */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
              <div className="w-9 h-9 rounded-xl bg-white/95 flex items-center justify-center p-1 shadow-xs">
                <img src={logoImg} alt="Pragya Connect" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight">
                PRAGYA <span className="text-gold-400">CONNECT</span>
              </span>
            </div>
          </div>

          {/* Inspirational Tagline */}
          <div className="my-12 relative z-10 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30">
              Transformative Mentorship
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
              Connect with Gurus, Expand Your Wisdom & Harmonize Life.
            </h1>
            <p className="text-sand-100/90 text-sm leading-relaxed max-w-md">
              A holistic ecosystem for students, seekers, and mentors in Yoga, Ayurveda, Mindful Living, and Modern Skills.
            </p>
          </div>

          {/* Quote Card */}
          <div className="relative z-10 p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <p className="text-sm font-serif italic text-sand-100 font-light leading-relaxed">
              "Yoga is the journey of the self, through the self, to the self."
            </p>
            <span className="text-[11px] font-bold text-gold-300 mt-2 block tracking-wider">
              — The Bhagavad Gita
            </span>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6 text-center sm:text-left">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                Enter your credentials to access your dashboard
              </p>
            </div>

            {/* Quick Demo Logins Bar */}
            <div className="mb-6 p-3.5 rounded-2xl bg-sand-50 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
                Quick Demo Accounts (Click to fill)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@pragya.org', 'password123')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800 dark:bg-forest-950/60 dark:text-forest-300 border border-forest-200 dark:border-forest-800 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('student@pragya.org', 'password123')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sand-100 hover:bg-sand-200 text-neutral-800 dark:bg-neutral-700/60 dark:text-neutral-200 border border-sand-300 dark:border-neutral-600 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('mentor@pragya.org', 'password123')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sand-100 hover:bg-sand-200 text-neutral-800 dark:bg-neutral-700/60 dark:text-neutral-200 border border-sand-300 dark:border-neutral-600 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Mentor
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                  Email Address / Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white placeholder-neutral-400 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Default demo password is: password123');
                    }}
                    className="text-xs font-semibold text-forest-700 dark:text-gold-400 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 text-sm rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white placeholder-neutral-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 flex items-center justify-center gap-2 shadow-lg shadow-forest-600/20 dark:shadow-gold-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-charcoal-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-forest-700 dark:text-gold-400 hover:underline">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
