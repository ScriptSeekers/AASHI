import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_CATALOG, GameCategory } from '@duvora/shared';
import { roomApi } from '../api/endpoints.js';
import { soundManager } from '../utils/sound.js';
import {
  Gamepad2,
  Heart,
  Crown,
  Zap,
  Layers,
  Search,
  Clock,
  Users,
  Play
} from 'lucide-react';

export const GameLibraryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', label: 'All Games (26)', icon: Gamepad2 },
    { id: 'card', label: 'UNO & Cards', icon: Layers },
    { id: 'board', label: 'Classic Board', icon: Crown },
    { id: 'couple', label: 'Couple Zone', icon: Heart },
    { id: 'quick', label: 'Quick Battles', icon: Zap }
  ];

  const filteredGames = GAME_CATALOG.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartGame = async (gameId: string) => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      soundManager.playPop();
      // Create quick private room and navigate to it with chosen game
      const res = await roomApi.create({
        name: `Match: ${gameId.toUpperCase()}`,
        isPrivate: true,
        maxPlayers: gameId === 'ludo' || gameId === 'uno' ? 4 : 2
      });
      navigate(`/room/${res.room.id}?start=${gameId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start game room');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-duvora-plum mb-3">
          Game Library
        </h1>
        <p className="text-sm sm:text-base text-duvora-plum/70 font-medium">
          Choose from 26 fully playable multiplayer games. Every match is synchronized in real time with server-authoritative rules.
        </p>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1.5 bg-white/70 backdrop-blur-sm rounded-2xl border border-duvora-pink/40 shadow-sm no-scrollbar">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundManager.playPop();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white shadow-sm'
                    : 'text-duvora-plum/70 hover:text-duvora-plum hover:bg-duvora-lilac/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-duvora-plum/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-duvora-pink/60 bg-white/90 text-xs font-medium text-duvora-plum outline-none focus:ring-2 focus:ring-duvora-berry shadow-sm"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-duvora-pink/60 shadow-glass hover:shadow-glass-hover hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-duvora-berry bg-duvora-pink/40">
                  {game.category}
                </span>
                <span className="text-[11px] font-semibold text-duvora-plum/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{game.estimatedMinutes}m
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-duvora-plum mb-1.5">{game.title}</h3>
              <p className="text-xs text-duvora-plum/75 font-body line-clamp-3 leading-relaxed">
                {game.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-duvora-pink/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-duvora-plum/60 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {game.minPlayers}-{game.maxPlayers}
              </span>

              <button
                onClick={() => handleStartGame(game.id)}
                disabled={isStarting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-duvora-plum hover:bg-duvora-berry text-white font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
