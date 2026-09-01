import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/services';
import logoImg from '../../assets/logo.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then choose "Forgot password?".');
      return;
    }

    setError(null);
    setNotice(null);
    setResetting(true);
    try {
      const res = await authApi.resetPassword(email);
      if (res.status) {
        setNotice(res.message || 'A reset link is on its way to your inbox.');
      } else {
        setError(res.message || 'Could not start a password reset.');
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setResetting(false);
    }
  };

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

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {notice && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
                {notice}
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
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="text-xs font-semibold text-forest-700 dark:text-gold-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resetting ? 'Sending…' : 'Forgot password?'}
                  </button>
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
              Accounts are created by the Pragya team. Need access?{' '}
              <a
                href="mailto:support@pragya-yog.com"
                className="font-bold text-forest-700 dark:text-gold-400 hover:underline"
              >
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
