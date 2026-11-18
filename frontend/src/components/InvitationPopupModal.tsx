import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Check, X, Gamepad2, Clock, Loader2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';

export const InvitationPopupModal: React.FC = () => {
  const {
    activeInvitation,
    outgoingInvitation,
    partnerInfo,
    acceptInvitation,
    declineInvitation,
    cancelOutgoingInvitation
  } = useSocket();

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [outgoingTimeLeft, setOutgoingTimeLeft] = useState<number>(60);

  // Incoming countdown
  useEffect(() => {
    if (!activeInvitation) return;
    const calculateSeconds = () => {
      const diff = Math.max(0, Math.round((new Date(activeInvitation.expiresAt).getTime() - Date.now()) / 1000));
      return diff;
    };

    setTimeLeft(calculateSeconds());
    const interval = setInterval(() => {
      const remaining = calculateSeconds();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        declineInvitation(activeInvitation.id);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvitation]);

  // Outgoing countdown
  useEffect(() => {
    if (!outgoingInvitation) return;
    const calculateSeconds = () => {
      const diff = Math.max(0, Math.round((new Date(outgoingInvitation.expiresAt).getTime() - Date.now()) / 1000));
      return diff;
    };

    setOutgoingTimeLeft(calculateSeconds());
    const interval = setInterval(() => {
      const remaining = calculateSeconds();
      setOutgoingTimeLeft(remaining);
      if (remaining <= 0) {
        cancelOutgoingInvitation();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [outgoingInvitation]);

  return (
    <>
      {/* 1. RECIPIENT: INCOMING INVITATION POPUP */}
      <AnimatePresence>
        {activeInvitation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md p-6 sm:p-7 overflow-hidden rounded-3xl bg-duvora-cloud/95 backdrop-blur-md border border-duvora-pink shadow-glow"
            >
              <div className="absolute top-3 right-4 text-duvora-berry">
                <Sparkles className="w-5 h-5 text-duvora-lavender" />
              </div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-duvora-pink/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-duvora-lavender/30 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                {/* Partner Profile Picture */}
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

                <h2 className="text-2xl font-bold font-heading text-duvora-plum mb-1">
                  Game Invitation! 💗
                </h2>

                <p className="text-duvora-plum/80 text-sm sm:text-base mb-3 font-body">
                  <strong className="text-duvora-berry font-semibold">{activeInvitation.senderName}</strong> wants to play together right now!
                </p>

                {/* Game Name Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-duvora-pink/40 to-duvora-lilac/40 border border-duvora-pink/60 shadow-xs mb-4">
                  <Gamepad2 className="w-4 h-4 text-duvora-berry" />
                  <span className="font-heading font-extrabold text-sm text-duvora-plum">
                    {activeInvitation.gameTitle || 'Couple Game'}
                  </span>
                </div>

                {/* Timer Pill */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-duvora-plum/60 bg-duvora-lilac/40 px-3 py-1 rounded-full mb-6">
                  <Clock className="w-3.5 h-3.5 text-duvora-berry" />
                  <span>Expires in {timeLeft}s</span>
                </div>
              </div>

              {/* Accept & Decline Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => declineInvitation(activeInvitation.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-duvora-pink bg-white/80 hover:bg-white text-duvora-plum font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm"
                >
                  <X className="w-4 h-4 text-duvora-plum/70" />
                  <span>DECLINE</span>
                </button>

                <button
                  onClick={() => acceptInvitation(activeInvitation.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender hover:opacity-95 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-neon text-sm"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>ACCEPT & PLAY</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SENDER: OUTGOING INVITATION WAITING MODAL */}
      <AnimatePresence>
        {outgoingInvitation && !activeInvitation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm p-6 overflow-hidden rounded-3xl bg-white border border-duvora-pink shadow-glow text-center"
            >
              <div className="w-16 h-16 rounded-full bg-duvora-pink/40 border border-duvora-pink flex items-center justify-center mx-auto mb-3 relative">
                {partnerInfo?.avatar ? (
                  <img
                    src={partnerInfo.avatar}
                    alt={partnerInfo.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-heading font-black text-2xl text-duvora-berry">
                    {partnerInfo?.name?.charAt(0) || 'P'}
                  </span>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs">
                  <Loader2 className="w-4 h-4 text-duvora-berry animate-spin" />
                </div>
              </div>

              <h3 className="font-heading font-black text-xl text-duvora-plum mb-1">
                Waiting for {outgoingInvitation.recipientName}...
              </h3>

              <p className="text-xs text-duvora-plum/70 font-medium mb-3">
                Invited to play <strong className="text-duvora-berry">{outgoingInvitation.gameTitle || 'Couple Game'}</strong>
              </p>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-duvora-plum/60 bg-duvora-lilac/50 px-3 py-1 rounded-full mb-6">
                <Clock className="w-3.5 h-3.5 text-duvora-berry" />
                <span>Waiting for response ({outgoingTimeLeft}s)</span>
              </div>

              <button
                onClick={cancelOutgoingInvitation}
                className="w-full py-2.5 rounded-2xl border border-duvora-pink/80 bg-white hover:bg-gray-50 text-duvora-plum font-semibold text-xs transition-all shadow-xs"
              >
                Cancel Invitation
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
