'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

function SignInForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return '';
    switch (errorCode) {
      case 'CredentialsSignin':
        return 'Invalid email or password';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const displayError = error || getErrorMessage(urlError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/',
      });
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#0f2e4a] tracking-tight">
          Note<span className="text-sky-600">Nest</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Sign in to your account
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
        {/* Error Display */}
        {displayError && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 font-medium">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="signin-email"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="signin-email"
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
              htmlFor="signin-password"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              <LogIn className="w-4 h-4" />
            )}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Link to Sign Up */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-sky-600 hover:text-sky-700 font-bold transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#60a5fa]" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
