import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Info, AlertCircle, Megaphone } from 'lucide-react';
import { Announcement } from '../types';
import { useMachineContext } from '../context/MachineContext';

interface Props {
  announcements: Announcement[];
}

const AnnouncementsTicker: React.FC<Props> = ({ announcements }) => {
  const { layout } = useMachineContext();
  const [now, setNow] = useState(new Date());

  // Update time for scheduling logic
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const activeAnnouncements = announcements.filter(a => {
    if (!a.isActive) return false;
    
    // Only show TICKER mode announcements here, or legacy ones undefined
    if (a.displayMode && a.displayMode !== 'TICKER') return false;

    if (a.schedule) {
        if (a.schedule.start && new Date(a.schedule.start) > now) return false;
        if (a.schedule.end && new Date(a.schedule.end) < now) return false;
    }
    
    return true;
  });

  // Seamless Loop Logic: Repeat the list multiple times to ensure we can animate smoothly
  const seamlessList = useMemo(() => {
      if (activeAnnouncements.length === 0) return [];
      // Create enough duplicates to fill the screen width comfortably
      return Array(10).fill(activeAnnouncements).flat();
  }, [activeAnnouncements]);

  if (activeAnnouncements.length === 0) return null;

  const duration = layout.tickerSpeed || 30;
  const height = layout.tickerHeight || 60; // Get height from context
  const fontSize = layout.tickerFontSize || 18; // Get font size from context

  return (
    <div 
        className="bg-brewery-card border-y border-brewery-border overflow-hidden relative flex items-center group z-40 shadow-lg"
        style={{ height: height }}
    >
      {/* Animation wrapper */}
      <div 
        className="flex animate-marquee whitespace-nowrap hover:pause will-change-transform pl-4 items-center h-full"
        style={{ animationDuration: `${duration}s` }}
      >
        {seamlessList.map((announcement, index) => (
          <div 
            key={`${announcement.id}-${index}`} 
            className={`
              flex items-center mx-8 px-6 py-1.5 rounded-lg border-l-4 shadow-lg transition-all duration-300
              ${announcement.type === 'ATTENTION' 
                ? 'bg-orange-950/80 border-l-orange-500 border-y border-r border-white/10 text-orange-100 animate-flash-attention' 
                : announcement.type === 'CRITICAL' 
                ? 'bg-rose-950/90 border-l-rose-600 border-y border-r border-rose-500/30 text-white animate-pulse-critical' 
                : announcement.type === 'WARNING'
                ? 'bg-amber-950/60 border-l-amber-500 border-y border-r border-white/5 text-amber-100'
                : 'bg-blue-950/40 border-l-blue-500 border-y border-r border-white/5 text-blue-100'
              }
            `}
          >
            {announcement.type === 'ATTENTION' && <Megaphone className="text-orange-500 mr-3 shrink-0 animate-wiggle" size={fontSize * 1.2} strokeWidth={2.5} />}
            {announcement.type === 'CRITICAL' && <AlertCircle className="text-rose-500 mr-3 shrink-0 animate-ping-slow" size={fontSize * 1.2} strokeWidth={3} />}
            {announcement.type === 'WARNING' && <AlertTriangle className="text-amber-500 mr-3 shrink-0" size={fontSize * 1.2} />}
            {announcement.type === 'INFO' && <Info className="text-blue-400 mr-3 shrink-0" size={fontSize * 1.2} />}
            
            <span 
                className={`font-mono font-bold tracking-tight uppercase ${
                  announcement.type === 'CRITICAL' ? 'drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : ''
                }`}
                style={{ fontSize: `${fontSize}px` }}
            >
              {announcement.message}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-10%, 0, 0); }
        }
        
        /* SOPHISTICATED CRITICAL ANIMATION: Aggressive Red Flash */
        @keyframes pulse-critical {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(225, 29, 72, 0.2) inset;
            border-color: rgba(225, 29, 72, 0.5);
          }
          50% { 
            box-shadow: 0 0 30px rgba(225, 29, 72, 0.6) inset;
            border-color: rgba(255, 255, 255, 0.8);
            background-color: rgba(136, 19, 55, 0.9);
          }
        }

        /* SOPHISTICATED ATTENTION ANIMATION: Orange/Yellow Pulse */
        @keyframes flash-attention {
          0%, 100% { border-color: rgba(249, 115, 22, 0.5); transform: scale(1); }
          50% { border-color: #fbbf24; transform: scale(1.02); background-color: rgba(124, 45, 18, 0.8); }
        }

        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
        }

        @keyframes ping-slow {
            75%, 100% { transform: scale(1.5); opacity: 0; }
        }

        .animate-marquee {
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animate-pulse-critical {
          animation: pulse-critical 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-flash-attention {
          animation: flash-attention 2s ease-in-out infinite;
        }

        .animate-wiggle {
            animation: wiggle 0.5s infinite ease-in-out;
        }
        
        .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsTicker;