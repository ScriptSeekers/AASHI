import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Check, X, Gamepad2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';

export const InvitationPopupModal: React.FC = () => {
  const { activeInvitation, acceptInvitation, declineInvitation } = useSocket();

  if (!activeInvitation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-duvora-cloud/95 backdrop-blur-md border border-duvora-pink shadow-glow"
        >
          {/* Decorative Sparkles & Hearts */}
          <div className="absolute top-3 right-4 text-duvora-berry animate-pulse-subtle">
            <Sparkles className="w-5 h-5 text-duvora-lavender" />
          </div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-duvora-pink/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-duvora-lavender/30 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-duvora-pink via-duvora-berry to-duvora-lavender p-1 shadow-neon flex items-center justify-center animate-heartbeat">
                {activeInvitation.senderAvatar ? (
                  <img
                    src={activeInvitation.senderAvatar}
                    alt={activeInvitation.senderName}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-duvora-berry font-heading text-2xl font-bold">
                    {activeInvitation.senderName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm text-duvora-berry">
                <Heart className="w-5 h-5 fill-duvora-berry text-duvora-berry" />
              </div>
            </div>

            <h2 className="text-2xl font-bold font-heading text-duvora-plum mb-1 flex items-center justify-center gap-2">
              <span>💗 You've got a game invitation!</span>
            </h2>

            <p className="text-duvora-plum/80 text-base mb-4 font-body leading-relaxed">
              <strong className="text-duvora-berry font-semibold">{activeInvitation.senderName}</strong> invited you to play together in{' '}
              <span className="font-semibold text-duvora-plum bg-duvora-lilac/70 px-2 py-0.5 rounded-lg">
                {activeInvitation.roomName}
              </span>.
            </p>

            <div className="flex items-center gap-2 text-xs text-duvora-plum/60 bg-duvora-lilac/40 px-3 py-1.5 rounded-full mb-6">
              <Gamepad2 className="w-3.5 h-3.5 text-duvora-berry" />
              <span>Room Code: {activeInvitation.roomCode}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => declineInvitation(activeInvitation.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-duvora-pink/80 bg-white/80 hover:bg-white text-duvora-plum font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <X className="w-4 h-4 text-duvora-plum/70" />
              <span>DECLINE</span>
            </button>

            <button
              onClick={() => acceptInvitation(activeInvitation.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender hover:opacity-95 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-neon"
            >
              <Check className="w-4 h-4 text-white" />
              <span>ACCEPT INVITATION</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
