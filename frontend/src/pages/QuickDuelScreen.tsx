import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { soundManager } from '../utils/sound.js';
import { Zap, Play, Sparkles, ChevronDown, Heart } from 'lucide-react';

export const QuickDuelScreen: React.FC = () => {
  const { user } = useAuth();
  const { partnerOnline, partnerInfo, invitePartner } = useSocket();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [topicIndex, setTopicIndex] = useState(0);

  const topics = [
    'Fun & Quirky',
    'Deep Romance',
    'Who Knows Who Best?',
    'Dream Travel',
    'Spicy Confessions'
  ];

  const handleStartDuel = async () => {
    if (isStarting) return;
    setIsStarting(true);
    soundManager.playPop();

    const partnerName = user?.partnerName || partnerInfo?.name || 'Your partner';

    if (!partnerOnline) {
      alert(`${partnerName} is currently offline. Both partners must be online to play!`);
      setIsStarting(false);
      return;
    }

    try {
      await invitePartner('would_you_rather');
    } catch (err: any) {
      alert(err.message || 'Failed to start duel');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCycleTopic = () => {
    soundManager.playPop();
    setTopicIndex((topicIndex + 1) % topics.length);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-[#FFFAFD] text-[#2B1420]">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE8F0] shadow-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-[#D979AE] animate-pulse" />
          <span className="text-xs font-bold text-[#954072] uppercase tracking-wider">
            AASHI DUEL • ARPIT & SHREE
          </span>
        </div>

        {/* Duo Presence Indicator */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-full shadow-[0_8px_24px_-4px_rgba(74,40,59,0.06)] border border-[#F5DEEB] mb-8">
          <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#FFF0F4]">
            <div className="w-10 h-10 rounded-full bg-[#FFD8EA] text-[#2B1420] font-heading font-black text-lg flex items-center justify-center">
              A
            </div>
            <span className="text-sm font-bold text-[#2B1420]">Arpit</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#D979AE] text-white flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-white" />
          </div>

          <div className="flex items-center gap-2 pr-1 pl-3 py-1 rounded-full bg-[#FFF0F4]">
            <span className="text-sm font-bold text-[#2B1420]">Shree</span>
            <div className="w-10 h-10 rounded-full bg-[#FFD8EA] text-[#2B1420] font-heading font-black text-lg flex items-center justify-center">
              S
            </div>
          </div>
        </div>

        {/* Main Clean Hero Copy */}
        <div className="mb-8 space-y-3">
          <h1 className="font-heading font-bold text-[28px] sm:text-[32px] leading-tight text-[#2B1420]">
            Ready for a quick 2-minute duel?
          </h1>
          <p className="font-body text-[18px] text-[#524249] leading-relaxed max-w-xs mx-auto">
            Answer 5 rapid-fire questions to see how in sync you both are today.
          </p>
        </div>

        {/* Key Information Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFE8F0] text-xs font-semibold text-[#524249] mb-10 shadow-xs">
          <span className="font-bold text-[#D979AE]">⚡ 5 Questions</span>
          <span>•</span>
          <span>⏱️ 2 Mins</span>
          <span>•</span>
          <span>💖 Real-time sync</span>
        </div>

        {/* Primary Action Button */}
        <div className="w-full space-y-3">
          <button
            onClick={handleStartDuel}
            disabled={isStarting}
            className="w-full h-[52px] rounded-full bg-[#D979AE] hover:bg-[#c9699e] text-white font-heading font-bold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_24px_-4px_rgba(217,121,174,0.4)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isStarting ? (
              <span>Inviting Partner...</span>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Start Quick Duel</span>
              </>
            )}
          </button>

          {/* Secondary Sub-Action: Topic Switcher */}
          <button
            onClick={handleCycleTopic}
            disabled={isStarting}
            className="w-full min-h-[48px] px-6 rounded-full bg-[#FFF0F4] hover:bg-[#FFE8F0] text-[#524249] font-body text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#D979AE]" />
            <span>
              Change Topic: <strong className="text-[#2B1420] font-bold">{topics[topicIndex]}</strong>
            </span>
            <ChevronDown className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* Live Partner Status */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-[#524249]/70 font-medium">
          <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>Partner status: {partnerOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
};
