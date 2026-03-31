'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-10 font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed -top-24 -right-24 w-80 h-80 rounded-full bg-orange-200 opacity-20 blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-20 -left-20 w-64 h-64 rounded-full bg-orange-300 opacity-10 blur-3xl pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block">
            <Image
              src="/tabrova-logo.png"
              alt="Tabrova"
              width={160}
              height={56}
              className="object-contain mx-auto"
              priority
            />
          </Link>
          <p className="mt-2 text-sm text-gray-400 tracking-wide">Restaurant Management System</p>
        </div>

        {children}

        {/* Back to home */}
        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <Layout>
        {/* Success Card */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-xl shadow-orange-100/40 px-6 py-8 sm:px-8">
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
              Check Your Email
            </h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              We've sent a password reset link to{' '}
              <span className="font-semibold text-gray-800">{email}</span>
            </p>

            {/* Info box */}
            <div className="flex items-start gap-2.5 px-4 py-3 mb-6 bg-orange-50 border border-orange-100 rounded-xl text-left">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <p className="text-sm text-orange-700 leading-relaxed">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-orange-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Resend */}
        <div className="mt-5 text-center">
          <button
            onClick={() => setSuccess(false)}
            className="text-sm text-gray-400 hover:text-orange-500 font-medium transition-colors"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-xl shadow-orange-100/40 px-6 py-8 sm:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Forgot Password?
          </h1>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-xl">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-orange-400 focus:bg-orange-50 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-orange-300 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                Sending…
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>

      {/* Remember password */}
      <div className="mt-5 text-center">
        <p className="text-sm text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </Layout>
  );
}