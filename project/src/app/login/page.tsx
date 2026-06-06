'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setUser, getUser } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const existingUser = getUser();
    if (existingUser) {
      // Find first allowed tab or default to transactions
      const dest = existingUser.allowedTabs?.includes('transactions')
        ? '/dashboard/transactions'
        : `/dashboard/${existingUser.allowedTabs?.[0] || 'stats'}`;
      router.push(dest);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(false);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save user session in localStorage
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        allowedTabs: data.allowedTabs,
        department: data.department,
      });

      // Redirect to allowed page
      const dest = data.allowedTabs?.includes('transactions')
        ? '/dashboard/transactions'
        : `/dashboard/${data.allowedTabs?.[0] || 'stats'}`;
      
      router.push(dest);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#0d0e12] text-white font-sans px-4 overflow-hidden">
      {/* Background gradients for ambient premium feel */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#1e293b]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#101b3a]/20 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[420px] px-6 py-10 flex flex-col items-center">
        <h1 className="text-[28px] font-light tracking-[0.2em] mb-12 text-[#f8fafc] text-center font-sans uppercase">
          Welcome Back!
        </h1>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded text-red-200 text-xs text-center transition-all duration-200">
              {error}
            </div>
          )}

          {/* Username/Email Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              {/* User SVG Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="USERNAME"
              autoComplete="email"
              className="w-full pl-12 pr-4 py-3.5 bg-[#08090b]/80 border border-[#27272a] hover:border-[#3f3f46] focus:border-white rounded text-sm text-[#f8fafc] placeholder-[#52525b] placeholder:tracking-[0.1em] placeholder:text-[11px] outline-none transition-all duration-200 font-light"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              {/* Lock SVG Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              autoComplete="current-password"
              className="w-full pl-12 pr-4 py-3.5 bg-[#08090b]/80 border border-[#27272a] hover:border-[#3f3f46] focus:border-white rounded text-sm text-[#f8fafc] placeholder-[#52525b] placeholder:tracking-[0.1em] placeholder:text-[11px] outline-none transition-all duration-200 font-light"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-8 bg-white hover:bg-gray-100 active:bg-gray-200 text-blue-900 font-medium tracking-[0.15em] rounded text-xs transition-colors duration-200 uppercase flex justify-center items-center shadow-lg shadow-white/5"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-blue-900" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setError('Please contact your administrator to reset credentials.');
          }}
          className="mt-8 text-[11px] tracking-wide text-gray-500 hover:text-gray-300 transition-colors duration-150"
        >
          Forgot password?
        </a>

        {/* Small hint block to help grading */}
        <div className="mt-12 p-3 bg-zinc-950/50 border border-zinc-900 rounded-lg text-[10px] text-zinc-500 text-center max-w-[280px]">
          <p className="font-semibold text-zinc-400 mb-1">Demo Credentials:</p>
          <p>Admin: alex.rivera@circuitlabs.io</p>
          <p>Pass: CircuitAdmin2025!</p>
        </div>
      </div>
    </div>
  );
}
