import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-duvora-pink shadow-glass">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-duvora-pink/40 text-duvora-berry flex items-center justify-center mb-4 shadow-neon">
          <Heart className="w-8 h-8 fill-duvora-berry" />
        </div>
        <h1 className="font-heading font-black text-6xl text-duvora-plum mb-2">404</h1>
        <h2 className="font-heading font-bold text-xl text-duvora-plum mb-3">Lost in the Universe?</h2>
        <p className="text-xs text-duvora-plum/70 font-medium mb-6">
          The page or game arena you are searching for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>RETURN HOME</span>
        </Link>
      </div>
    </div>
  );
};
