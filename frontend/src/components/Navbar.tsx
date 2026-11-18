import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { soundManager } from '../utils/sound.js';
import { 
  Heart, 
  Gamepad2, 
  Trophy, 
  History, 
  User as UserIcon, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Home
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, partnerOnline } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [soundOn, setSoundOn] = React.useState(soundManager.isEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playPop();
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Game Library', path: '/games', icon: Gamepad2 },
    { name: 'History', path: '/history', icon: History },
    { name: 'Achievements', path: '/achievements', icon: Trophy }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-duvora-cloud/85 border-b border-duvora-pink/40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-duvora-berry via-duvora-pink to-duvora-lavender p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-duvora-berry fill-duvora-berry animate-heartbeat" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-2xl tracking-wide bg-gradient-to-r from-duvora-berry to-duvora-lavender bg-clip-text text-transparent">
              DUVORA
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-duvora-plum/60 tracking-wider">
              LOVE HARD. PLAY HARDER.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-white/70 p-1.5 rounded-2xl border border-duvora-pink/30 shadow-sm">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white shadow-sm'
                      : 'text-duvora-plum/80 hover:text-duvora-berry hover:bg-duvora-lilac/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2.5 rounded-xl border border-duvora-pink/40 bg-white/80 hover:bg-white text-duvora-plum/80 hover:text-duvora-berry transition-all shadow-sm"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-duvora-plum/50" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Partner Status Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-duvora-lilac/50 border border-duvora-pink/40 text-xs font-medium text-duvora-plum">
                <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span>
                  {user.partnerName ? `${user.partnerName} (${partnerOnline ? 'Online' : 'Offline'})` : 'Solo Mode'}
                </span>
              </div>

              {/* Profile Link */}
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-white/80 hover:bg-white border border-duvora-pink/50 transition-all shadow-sm group"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-duvora-pink flex items-center justify-center font-bold text-sm text-duvora-berry">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-semibold text-duvora-plum group-hover:text-duvora-berry">
                  {user.name.split(' ')[0]}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                aria-label="Logout"
                className="p-2.5 rounded-xl border border-duvora-pink/40 bg-white/80 hover:bg-rose-50 hover:text-rose-600 text-duvora-plum/70 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white shadow-neon hover:opacity-95 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
