import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@aashi/shared';
import { useAuth } from '../context/AuthContext.js';
import { Heart, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, AtSign } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data: RegisterInput) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await registerAuth(data);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-aashi-cloud/90 backdrop-blur-md border border-aashi-pink shadow-glass">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-aashi-berry to-aashi-lavender p-1 shadow-neon mb-3 flex items-center justify-center animate-heartbeat">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-aashi-plum">Create Account</h1>
          <p className="text-sm text-aashi-plum/70 font-medium mt-1">
            Join AASHI and invite your favorite person
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase tracking-wider mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-aashi-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register('name')}
                placeholder="Romeo Montague"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-aashi-pink bg-white/90 text-sm font-medium text-aashi-plum placeholder:text-aashi-plum/40 outline-none focus:ring-2 focus:ring-aashi-berry transition-all shadow-sm"
              />
            </div>
            {errors.name && (
              <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase tracking-wider mb-1">
              Unique Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-aashi-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...register('username')}
                placeholder="romeo_duv"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-aashi-pink bg-white/90 text-sm font-medium text-aashi-plum placeholder:text-aashi-plum/40 outline-none focus:ring-2 focus:ring-aashi-berry transition-all shadow-sm"
              />
            </div>
            {errors.username && (
              <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                {errors.username.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-aashi-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register('email')}
                placeholder="romeo@aashi.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-aashi-pink bg-white/90 text-sm font-medium text-aashi-plum placeholder:text-aashi-plum/40 outline-none focus:ring-2 focus:ring-aashi-berry transition-all shadow-sm"
              />
            </div>
            {errors.email && (
              <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-aashi-plum uppercase tracking-wider mb-1">
              Password (min. 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-aashi-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-aashi-pink bg-white/90 text-sm font-medium text-aashi-plum placeholder:text-aashi-plum/40 outline-none focus:ring-2 focus:ring-aashi-berry transition-all shadow-sm"
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
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender hover:opacity-95 text-white font-heading font-bold text-base shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>JOIN AASHI</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-aashi-pink/40 text-center">
          <p className="text-xs font-medium text-aashi-plum/70">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-aashi-berry hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
