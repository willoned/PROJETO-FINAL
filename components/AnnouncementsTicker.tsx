import React, { useState, useEffect } from 'react';
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
    
    if (a.schedule) {
        if (a.schedule.start && new Date(a.schedule.start) > now) return false;
        if (a.schedule.end && new Date(a.schedule.end) < now) return false;
    }
    
    return true;
  });

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="bg-brewery-card border-y border-brewery-border overflow-hidden relative h-12 flex items-center group">
      {/* Label Badge */}
      <div className="absolute left-0 top-0 bottom-0 bg-indigo-600 px-4 flex items-center z-20 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
        <span className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
            <AlertCircle size={14} className="animate-pulse" />
            Avisos
        </span>
      </div>
      
      {/* Gradient Mask */}
      <div className="absolute left-20 top-0 bottom-0 w-16 bg-gradient-to-r from-brewery-card to-transparent z-10 pointer-events-none" />

      {/* Animation wrapper - Hardware Accelerated */}
      <div 
        className="flex animate-marquee whitespace-nowrap ml-32 hover:pause will-change-transform"
        style={{ animationDuration: `${layout.tickerSpeed || 20}s` }}
      >
        {activeAnnouncements.map((announcement, index) => (
          <div 
            key={`${announcement.id}-${index}`} 
            className={`
              flex items-center mx-12 px-4 py-1 rounded-full transition-all duration-300
              ${announcement.type === 'ATTENTION' 
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-black border-2 border-yellow-400 animate-flash-alert shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
                : announcement.type === 'CRITICAL' 
                ? 'bg-rose-950/60 border border-rose-900/50 animate-critical-attention shadow-[0_0_10px_rgba(244,63,94,0.2)]' 
                : announcement.type === 'WARNING'
                ? 'bg-amber-950/40 border border-amber-900/30 animate-warning-float'
                : 'bg-blue-950/30 border border-blue-900/20 hover:bg-blue-900/40'
              }
            `}
          >
            {announcement.type === 'ATTENTION' && <Megaphone className="text-black mr-2 shrink-0 animate-wiggle" size={24} strokeWidth={2.5} />}
            {announcement.type === 'CRITICAL' && <AlertCircle className="text-rose-500 mr-2 shrink-0" size={20} />}
            {announcement.type === 'WARNING' && <AlertTriangle className="text-amber-500 mr-2 shrink-0" size={20} />}
            {announcement.type === 'INFO' && <Info className="text-blue-500 mr-2 shrink-0" size={20} />}
            
            <span className={`font-mono text-lg font-bold tracking-tight ${
              announcement.type === 'ATTENTION' ? 'text-black drop-shadow-sm uppercase' :
              announcement.type === 'CRITICAL' ? 'text-rose-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 
              announcement.type === 'WARNING' ? 'text-amber-100' : 'text-blue-100'
            }`}>
              {announcement.message}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        
        @keyframes critical-attention {
          0%, 100% { 
            transform: scale(1);
            background-color: rgba(76, 5, 25, 0.6);
            box-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
          }
          50% { 
            transform: scale(1.05);
            background-color: rgba(136, 19, 55, 0.6);
            box-shadow: 0 0 20px rgba(244, 63, 94, 0.6);
          }
        }

        @keyframes warning-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -3px, 0); }
        }

        @keyframes flash-alert {
            0%, 100% { opacity: 1; transform: scale(1); border-color: #fbbf24; }
            50% { opacity: 0.9; transform: scale(1.05); border-color: #fff; }
        }

        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
        }

        .animate-marquee {
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animate-critical-attention {
          animation: critical-attention 2s infinite ease-in-out;
          will-change: transform, background-color, box-shadow;
        }

        .animate-warning-float {
          animation: warning-float 3s infinite ease-in-out;
          will-change: transform;
        }

        .animate-flash-alert {
            animation: flash-alert 1s infinite linear;
            will-change: transform, opacity;
        }

        .animate-wiggle {
            animation: wiggle 0.5s infinite ease-in-out;
        }

        .hover\\:pause:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation-duration: 60s !important;
          }
          .animate-critical-attention, 
          .animate-warning-float,
          .animate-flash-alert,
          .animate-wiggle {
            animation: none !important;
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsTicker;