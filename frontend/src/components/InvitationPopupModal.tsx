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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aashi-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md p-6 sm:p-7 overflow-hidden rounded-3xl bg-aashi-cloud/95 backdrop-blur-md border border-aashi-pink shadow-glow"
            >
              <div className="absolute top-3 right-4 text-aashi-berry">
                <Sparkles className="w-5 h-5 text-aashi-lavender" />
              </div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-aashi-pink/30 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-aashi-lavender/30 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                {/* Partner Profile Picture */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-aashi-pink via-aashi-berry to-aashi-lavender p-1 shadow-neon flex items-center justify-center animate-heartbeat">
                    {activeInvitation.senderAvatar ? (
                      <img
                        src={activeInvitation.senderAvatar}
                        alt={activeInvitation.senderName}
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-aashi-berry font-heading text-2xl font-bold">
                        {activeInvitation.senderName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm text-aashi-berry">
                    <Heart className="w-5 h-5 fill-aashi-berry text-aashi-berry" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold font-heading text-aashi-plum mb-1">
                  Game Invitation! 💗
                </h2>

                <p className="text-aashi-plum/80 text-sm sm:text-base mb-3 font-body">
                  <strong className="text-aashi-berry font-semibold">{activeInvitation.senderName}</strong> wants to play together right now!
                </p>

                {/* Game Name Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-aashi-pink/40 to-aashi-lilac/40 border border-aashi-pink/60 shadow-xs mb-4">
                  <Gamepad2 className="w-4 h-4 text-aashi-berry" />
                  <span className="font-heading font-extrabold text-sm text-aashi-plum">
                    {activeInvitation.gameTitle || 'Couple Game'}
                  </span>
                </div>

                {/* Timer Pill */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-aashi-plum/60 bg-aashi-lilac/40 px-3 py-1 rounded-full mb-6">
                  <Clock className="w-3.5 h-3.5 text-aashi-berry" />
                  <span>Expires in {timeLeft}s</span>
                </div>
              </div>

              {/* Accept & Decline Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => declineInvitation(activeInvitation.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-aashi-pink bg-white/80 hover:bg-white text-aashi-plum font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm"
                >
                  <X className="w-4 h-4 text-aashi-plum/70" />
                  <span>DECLINE</span>
                </button>

                <button
                  onClick={() => acceptInvitation(activeInvitation.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender hover:opacity-95 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-neon text-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aashi-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm p-6 overflow-hidden rounded-3xl bg-white border border-aashi-pink shadow-glow text-center"
            >
              <div className="w-16 h-16 rounded-full bg-aashi-pink/40 border border-aashi-pink flex items-center justify-center mx-auto mb-3 relative">
                {partnerInfo?.avatar ? (
                  <img
                    src={partnerInfo.avatar}
                    alt={partnerInfo.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-heading font-black text-2xl text-aashi-berry">
                    {partnerInfo?.name?.charAt(0) || 'P'}
                  </span>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs">
                  <Loader2 className="w-4 h-4 text-aashi-berry animate-spin" />
                </div>
              </div>

              <h3 className="font-heading font-black text-xl text-aashi-plum mb-1">
                Waiting for {outgoingInvitation.recipientName}...
              </h3>

              <p className="text-xs text-aashi-plum/70 font-medium mb-3">
                Invited to play <strong className="text-aashi-berry">{outgoingInvitation.gameTitle || 'Couple Game'}</strong>
              </p>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-aashi-plum/60 bg-aashi-lilac/50 px-3 py-1 rounded-full mb-6">
                <Clock className="w-3.5 h-3.5 text-aashi-berry" />
                <span>Waiting for response ({outgoingTimeLeft}s)</span>
              </div>

              <button
                onClick={cancelOutgoingInvitation}
                className="w-full py-2.5 rounded-2xl border border-aashi-pink/80 bg-white hover:bg-gray-50 text-aashi-plum font-semibold text-xs transition-all shadow-xs"
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
