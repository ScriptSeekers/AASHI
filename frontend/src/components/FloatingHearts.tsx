import React, { useMemo } from 'react';

export const FloatingHearts: React.FC = () => {
  // Pre-generate random heart coordinates so they don't jump on re-renders
  const hearts = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7 + 5) % 95}%`,
      top: `${(i * 13 + 10) % 90}%`,
      size: `${14 + (i % 4) * 6}px`,
      delay: `${(i * 0.7) % 5}s`,
      duration: `${6 + (i % 3) * 3}s`,
      opacity: 0.15 + (i % 3) * 0.1
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute text-duvora-berry animate-float-slow select-none"
          style={{
            left: h.left,
            top: h.top,
            fontSize: h.size,
            animationDelay: h.delay,
            animationDuration: h.duration,
            opacity: h.opacity
          }}
        >
          {h.id % 3 === 0 ? '💗' : h.id % 3 === 1 ? '✨' : '💖'}
        </span>
      ))}
    </div>
  );
};
