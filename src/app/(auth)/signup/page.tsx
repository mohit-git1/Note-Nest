'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, UserPlus, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Step 2: Automatically sign in after successful signup
      await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/',
      });
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getStrengthDisplay = () => {
    switch (strength) {
      case 0: return { width: '0%', color: 'bg-transparent', text: '' };
      case 1: return { width: '25%', color: 'bg-red-500', text: 'Weak' };
      case 2: return { width: '50%', color: 'bg-orange-500', text: 'Fair' };
      case 3: return { width: '75%', color: 'bg-yellow-400', text: 'Good' };
      case 4: return { width: '100%', color: 'bg-emerald-500', text: 'Strong' };
      default: return { width: '0%', color: 'bg-transparent', text: '' };
    }
  };

  const strengthDisplay = getStrengthDisplay();

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#0f2e4a] tracking-tight">
          Note<span className="text-sky-600">Nest</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Create your account
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength hint */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${strengthDisplay.color}`}
                    style={{ width: strengthDisplay.width }}
                  />
                </div>
                <div className="flex items-center justify-between px-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthDisplay.color.replace('bg-', 'text-')}`}>
                    {strengthDisplay.text}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    8+ chars, upper, number, special
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 px-0.5">
                {passwordsMatch ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-tight ${
                    passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {passwordsMatch
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold text-white bg-[#0f2e4a] hover:bg-[#1a3f61] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0f2e4a]/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Link to Sign In */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="text-sky-600 hover:text-sky-700 font-bold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
