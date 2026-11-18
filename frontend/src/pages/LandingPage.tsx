import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Gamepad2, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { BRAND, GAME_CATALOG } from '@aashi/shared';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        {/* Cute Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-aashi-pink shadow-sm mb-6"
        >
          <Sparkles className="w-4 h-4 text-aashi-berry animate-spin" />
          <span className="text-xs font-bold text-aashi-plum tracking-wide uppercase">
            A Private Universe for Two
          </span>
        </motion.div>

        {/* Brand Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="font-heading font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-aashi-plum mb-6 max-w-4xl leading-[1.08]"
        >
          Love hard.{' '}
          <span className="bg-gradient-to-r from-aashi-berry via-aashi-pink to-aashi-lavender bg-clip-text text-transparent drop-shadow-sm">
            Play harder.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-lg sm:text-xl text-aashi-plum/80 font-body mb-10 leading-relaxed"
        >
          AASHI is the ultimate real-time multiplayer gaming playground built exclusively for couples.
          Dive into intense UNO showdowns, royal chess battles, Ludo express, intimate couple confessions, and rapid-fire duels.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender text-white font-heading font-bold text-lg shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <span>ENTER AASHI</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Games Carousel / Grid Preview */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-aashi-plum">
              26+ Playable Couple & Board Games
            </h2>
            <p className="text-sm text-aashi-plum/70 font-medium">
              From competitive board classics to spicy romantic question rounds.
            </p>
          </div>
          <Link
            to="/games"
            className="text-sm font-bold text-aashi-berry hover:underline flex items-center gap-1"
          >
            View All Games <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GAME_CATALOG.slice(0, 4).map((game) => (
            <div
              key={game.id}
              className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-aashi-pink/60 shadow-glass hover:shadow-glass-hover hover:-translate-y-1.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-aashi-pink/50 text-aashi-berry flex items-center justify-center mb-4 shadow-sm">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                {game.badge && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-aashi-berry bg-aashi-pink/40 px-2 py-0.5 rounded-full mb-2">
                    {game.badge}
                  </span>
                )}
                <h3 className="font-heading font-bold text-lg text-aashi-plum mb-1.5">{game.title}</h3>
                <p className="text-xs text-aashi-plum/75 font-body line-clamp-3 leading-relaxed">
                  {game.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-aashi-pink/30 flex items-center justify-between text-[11px] font-semibold text-aashi-plum/60">
                <span>{game.minPlayers}-{game.maxPlayers} Players</span>
                <span>~{game.estimatedMinutes} mins</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-aashi-pink/40 text-center text-xs text-aashi-plum/60 font-medium">
        <p>© 2026 AASHI. All rights reserved. Love hard. Play harder.</p>
      </footer>
    </div>
  );
};
