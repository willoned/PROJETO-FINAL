import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertOctagon, Info, Megaphone, X } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

const AlertOverlay: React.FC = () => {
    const { announcements, removeAnnouncement } = useMachineContext();
    const [now, setNow] = useState(new Date());

    // Update time for scheduling logic
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 5000);
        return () => clearInterval(interval);
    }, []);

    // Filter for active OVERLAY announcements
    const activeAlert = announcements.find(a => {
        if (!a.isActive) return false;
        if (a.displayMode !== 'OVERLAY') return false;

        if (a.schedule) {
            if (a.schedule.start && new Date(a.schedule.start) > now) return false;
            if (a.schedule.end && new Date(a.schedule.end) < now) return false;
        }
        return true;
    });

    if (!activeAlert) return null;

    // Define styles based on type
    const getStyles = () => {
        switch (activeAlert.type) {
            case 'CRITICAL':
                return {
                    bg: 'bg-rose-950/95',
                    border: 'border-rose-500',
                    text: 'text-white',
                    iconColor: 'text-rose-500',
                    icon: <AlertOctagon size={120} className="animate-pulse" />,
                    animation: 'animate-pulse-fast',
                    glow: 'shadow-[0_0_100px_rgba(244,63,94,0.5)]'
                };
            case 'WARNING':
                return {
                    bg: 'bg-amber-950/95',
                    border: 'border-amber-500',
                    text: 'text-white',
                    iconColor: 'text-amber-500',
                    icon: <AlertTriangle size={120} className="animate-bounce" />,
                    animation: '',
                    glow: 'shadow-[0_0_100px_rgba(245,158,11,0.5)]'
                };
            case 'ATTENTION':
                return {
                    bg: 'bg-orange-900/95',
                    border: 'border-orange-500',
                    text: 'text-white',
                    iconColor: 'text-orange-500',
                    icon: <Megaphone size={120} className="animate-wiggle" />,
                    animation: '',
                    glow: 'shadow-[0_0_100px_rgba(249,115,22,0.5)]'
                };
            default: // INFO
                return {
                    bg: 'bg-blue-950/95',
                    border: 'border-blue-500',
                    text: 'text-white',
                    iconColor: 'text-blue-400',
                    icon: <Info size={120} />,
                    animation: '',
                    glow: 'shadow-[0_0_100px_rgba(59,130,246,0.5)]'
                };
        }
    };

    const style = getStyles();

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 md:p-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
                w-full max-w-6xl aspect-video md:aspect-auto md:min-h-[60vh]
                flex flex-col items-center justify-center text-center p-8 md:p-16 rounded-3xl border-[6px]
                ${style.bg} ${style.border} ${style.glow} ${style.animation}
                shadow-2xl relative overflow-hidden
            `}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #000 25%, #000 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }} 
                />

                <div className={`mb-8 ${style.iconColor} drop-shadow-2xl shrink-0`}>
                    {style.icon}
                </div>

                <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar my-4">
                    <p className={`text-4xl md:text-7xl font-black font-mono uppercase ${style.text} max-w-5xl leading-tight break-words whitespace-pre-wrap`}>
                        {activeAlert.message}
                    </p>
                </div>

                {/* EXIT BUTTON */}
                <button
                    onClick={() => removeAnnouncement(activeAlert.id)}
                    className="mt-8 group relative overflow-hidden bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-12 rounded-2xl text-xl uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(225,29,72,0.6)] animate-pulse hover:animate-none transition-all border-4 border-rose-400 hover:border-white hover:scale-105 active:scale-95 z-50 cursor-pointer shrink-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite]" />
                    <span className="flex items-center gap-4 relative z-10">
                        <X size={24} strokeWidth={4} />
                        FECHAR
                    </span>
                </button>
            </div>

            <style>{`
                .animate-pulse-fast {
                    animation: pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: .9; transform: scale(0.98); }
                }
                .animate-wiggle {
                    animation: wiggle 1s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default AlertOverlay;