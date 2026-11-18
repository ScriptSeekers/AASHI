import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-aashi-cloud/90 backdrop-blur-md border border-aashi-pink shadow-glass text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-aashi-pink/40 p-1 shadow-neon mb-4 flex items-center justify-center text-aashi-berry">
          <Heart className="w-7 h-7 fill-aashi-berry" />
        </div>

        <h1 className="font-heading font-extrabold text-2xl text-aashi-plum mb-2">Reset Password</h1>
        <p className="text-xs text-aashi-plum/70 font-medium mb-6">
          Enter your registered email address and we'll send you a recovery link.
        </p>

        {sent ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <p>If an account exists with that email, a password reset link has been dispatched!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative text-left">
              <Mail className="w-4 h-4 text-aashi-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your-email@aashi.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-aashi-pink bg-white/90 text-sm font-medium outline-none focus:ring-2 focus:ring-aashi-berry"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender text-white font-heading font-bold text-sm shadow-neon hover:opacity-95 transition-all"
            >
              SEND RESET LINK
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-aashi-pink/40">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-aashi-plum/70 hover:text-aashi-berry"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
