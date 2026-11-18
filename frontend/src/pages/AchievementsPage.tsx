import React, { useEffect, useState } from 'react';
import { Trophy, Heart, Flame, Crown, Sparkles, Star, Zap } from 'lucide-react';
import { statsApi } from '../api/endpoints.js';
import { UserStatsDTO } from '@aashi/shared';

export const AchievementsPage: React.FC = () => {
  const [stats, setStats] = useState<UserStatsDTO | null>(null);

  useEffect(() => {
    statsApi.getMyStats().then(res => setStats(res.statistics)).catch(() => {});
  }, []);

  const achievements = [
    {
      id: '1',
      key: 'aashi_welcome',
      title: 'Love Birds',
      desc: 'Welcome to Aashi! Began your exclusive couples journey.',
      icon: Heart,
      unlocked: true
    },
    {
      id: '2',
      key: 'first_win',
      title: 'Flirty Victor',
      desc: 'Won your first multiplayer match together.',
      icon: Trophy,
      unlocked: (stats?.gamesWon ?? 0) >= 1
    },
    {
      id: '3',
      key: 'streak_3',
      title: 'On Fire',
      desc: 'Achieve a winning streak of 3 consecutive matches.',
      icon: Flame,
      unlocked: (stats?.bestStreak ?? 0) >= 3
    },
    {
      id: '4',
      key: 'uno_master',
      title: 'UNO Champion',
      desc: 'Shed all cards down to zero and claimed an UNO victory.',
      icon: Crown,
      unlocked: Boolean(stats?.recentGames?.some(g => g.gameType === 'uno' && g.result === 'won'))
    },
    {
      id: '5',
      key: 'chess_grandmaster',
      title: 'Checkmate Royalty',
      desc: 'Conquered a standard legal match of Royal Chess.',
      icon: Star,
      unlocked: Boolean(stats?.recentGames?.some(g => g.gameType === 'chess' && g.result === 'won'))
    },
    {
      id: '6',
      key: 'confession_star',
      title: 'Soulmates',
      desc: 'Answered 10+ questions together in Couple Games.',
      icon: Sparkles,
      unlocked: (stats?.gamesPlayed ?? 0) >= 10
    },
    {
      id: '7',
      key: 'lightning_tap',
      title: 'Speed Demon',
      desc: 'Won in Fast Tap Battle or Reaction Speed Test.',
      icon: Zap,
      unlocked: Boolean(stats?.recentGames?.some(g => (g.gameType === 'fast_tap' || g.gameType === 'speed_reaction') && g.result === 'won'))
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 md:pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-aashi-pink/40 text-aashi-berry flex items-center justify-center shadow-sm">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl text-aashi-plum">Couple Achievements</h1>
          <p className="text-xs text-aashi-plum/70 font-medium">Badges and milestones unlocked through your multiplayer adventures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map(ach => {
          const Icon = ach.icon;
          return (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                ach.unlocked
                  ? 'bg-white/90 border-aashi-pink/80 shadow-glass'
                  : 'bg-white/40 border-gray-200 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  ach.unlocked
                    ? 'bg-gradient-to-tr from-aashi-berry to-aashi-lavender text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading font-bold text-base text-aashi-plum">{ach.title}</h3>
                  {ach.unlocked ? (
                    <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-aashi-plum/40 bg-gray-100 px-2 py-0.5 rounded-full">
                      LOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-aashi-plum/70 font-body leading-relaxed">{ach.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
