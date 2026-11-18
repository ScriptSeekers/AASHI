import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@duvora/shared';
import { useAuth } from '../context/AuthContext.js';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginInput) => {
    if (isSubmitting) return; // Prevent duplicate requests
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-duvora-cloud/90 backdrop-blur-md border border-duvora-pink shadow-glass">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-duvora-berry to-duvora-lavender p-1 shadow-neon mb-3 flex items-center justify-center animate-heartbeat">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-duvora-plum">DUVORA</h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-duvora-berry bg-duvora-pink/40 px-3 py-1 rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Realm: Arpit & Shree</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-duvora-plum uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-duvora-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register('email')}
                placeholder="Arpit@duvora.com or Shree@duvora.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-duvora-pink bg-white/90 text-sm font-medium text-duvora-plum placeholder:text-duvora-plum/40 outline-none focus:ring-2 focus:ring-duvora-berry focus:border-transparent transition-all shadow-sm"
              />
            </div>
            {errors.email && (
              <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-duvora-plum uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-duvora-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-duvora-pink bg-white/90 text-sm font-medium text-duvora-plum placeholder:text-duvora-plum/40 outline-none focus:ring-2 focus:ring-duvora-berry focus:border-transparent transition-all shadow-sm"
              />
            </div>
            {errors.password && (
              <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender hover:opacity-95 text-white font-heading font-bold text-base shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>ENTER DUVORA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-duvora-pink/40 text-center">
          <p className="text-xs text-duvora-plum/60 font-medium">
            🔒 Exclusive private couple platform. Public registration is closed.
          </p>
        </div>
      </div>
    </div>
  );
};
