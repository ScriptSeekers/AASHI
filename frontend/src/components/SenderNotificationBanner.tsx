import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';

export const SenderNotificationBanner: React.FC = () => {
  const { senderNotification, clearSenderNotification } = useSocket();

  if (!senderNotification) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-aashi-cloud/95 backdrop-blur-md border border-aashi-pink shadow-glow text-aashi-plum"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-aashi-pink/40 text-aashi-berry animate-bounce">
              <Heart className="w-5 h-5 fill-aashi-berry" />
            </div>
            <p className="font-medium text-sm text-aashi-plum">{senderNotification}</p>
          </div>
          <button
            onClick={clearSenderNotification}
            className="p-1 rounded-lg text-aashi-plum/60 hover:text-aashi-plum hover:bg-aashi-lilac/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
