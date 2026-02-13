import React, { useMemo } from 'react';
import { PartyEffect } from '../types';
import { Trophy, Medal, Flag } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

interface Props {
  effect: PartyEffect;
}

const PartyOverlay: React.FC<Props> = ({ effect }) => {
  const { layout } = useMachineContext();

  // 1. Bubbles (Brewery)
  const bubbles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    size: `${10 + Math.random() * 30}px`,
    opacity: 0.3 + Math.random() * 0.5
  })), []);

  // 2. Confetti (Generic / Celebration)
  const confetti = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${2 + Math.random() * 3}s`,
    animationDelay: `${Math.random() * 5}s`,
    bg: ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 5)],
    size: `${8 + Math.random() * 8}px`
  })), []);

  // 3. World Cup (Green/Yellow/Blue)
  const worldCupConfetti = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${3 + Math.random() * 2}s`,
    animationDelay: `${Math.random() * 5}s`,
    bg: ['#16a34a', '#facc15', '#2563eb'][Math.floor(Math.random() * 3)], // Brazil Colors
    size: `${10 + Math.random() * 10}px`
  })), []);

  // 4. Olympics (5 Colors)
  const olympicsConfetti = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${2.5 + Math.random() * 2}s`,
    animationDelay: `${Math.random() * 4}s`,
    bg: ['#3b82f6', '#facc15', '#000000', '#16a34a', '#ef4444'][Math.floor(Math.random() * 5)], // Olympic Rings Colors
    size: `${8 + Math.random() * 8}px`
  })), []);

  // 5. Birthday (Balloons)
  const balloons = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    animationDuration: `${8 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 5}s`,
    scale: 0.8 + Math.random() * 0.5,
    emoji: ['🎈', '🎉', '🎁'][Math.floor(Math.random() * 3)]
  })), []);

  // 6. Bonus (Money)
  const moneyRain = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${3 + Math.random() * 4}s`,
    animationDelay: `${Math.random() * 5}s`,
    emoji: ['💸', '💰', '💵', '🤑'][Math.floor(Math.random() * 4)],
    size: `${20 + Math.random() * 20}px`
  })), []);

  // 7. Goal Met (Stars & Trophies)
  const goalItems = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${2 + Math.random() * 3}s`,
    animationDelay: `${Math.random() * 2}s`,
    type: Math.random() > 0.8 ? 'TROPHY' : 'STAR',
    size: `${10 + Math.random() * 15}px`,
    color: '#fbbf24' // Gold
  })), []);

  // 8. Custom (User Uploaded Image)
  const customItems = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${3 + Math.random() * 4}s`,
    animationDelay: `${Math.random() * 5}s`,
    size: `${30 + Math.random() * 40}px`
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden select-none">
      
      {/* 1. GLOW EFFECT (Standard) */}
      {effect === 'GLOW' && (
        <>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 mix-blend-overlay" />
            <div className="absolute inset-0 animate-party-glow opacity-30" />
        </>
      )}

      {/* 2. DISCO (Strobe) */}
      {effect === 'DISCO' && (
         <div className="absolute inset-0 animate-disco mix-blend-color-dodge pointer-events-none" />
      )}

      {/* 3. BUBBLES (Brewery Theme) */}
      {effect === 'BUBBLES' && (
        <div className="absolute inset-0">
             {/* Amber Tint for Beer Look */}
            <div className="absolute inset-0 bg-amber-600/10 mix-blend-overlay" />
            {bubbles.map(b => (
                <div 
                    key={b.id}
                    className="absolute bottom-0 rounded-full border border-amber-300/40 bg-amber-200/10 animate-rise"
                    style={{
                        left: b.left,
                        width: b.size,
                        height: b.size,
                        animationDelay: b.animationDelay,
                        opacity: b.opacity
                    }}
                />
            ))}
        </div>
      )}

      {/* 4. CONFETTI (Standard) */}
      {effect === 'CONFETTI' && (
        <div className="absolute inset-0">
            {confetti.map(c => (
                <div 
                    key={c.id}
                    className="absolute -top-4 rounded-sm animate-fall"
                    style={{
                        left: c.left,
                        width: c.size,
                        height: c.size,
                        backgroundColor: c.bg,
                        animationDuration: c.animationDuration,
                        animationDelay: c.animationDelay
                    }}
                />
            ))}
        </div>
      )}

      {/* 5. WORLD CUP */}
      {effect === 'WORLDCUP' && (
        <div className="absolute inset-0">
             <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay" />
             {worldCupConfetti.map(c => (
                <div 
                    key={c.id}
                    className="absolute -top-4 rounded-full animate-fall"
                    style={{
                        left: c.left,
                        width: c.size,
                        height: c.size,
                        backgroundColor: c.bg,
                        animationDuration: c.animationDuration,
                        animationDelay: c.animationDelay
                    }}
                />
            ))}
            {/* Occasional Flag/Ball Icon */}
            <div className="absolute top-1/4 left-1/4 animate-pulse opacity-10 text-green-500">
                <Flag size={200} />
            </div>
            <div className="absolute bottom-1/4 right-1/4 animate-bounce opacity-10 text-yellow-500">
                <Trophy size={150} />
            </div>
        </div>
      )}

      {/* 6. OLYMPICS */}
      {effect === 'OLYMPICS' && (
        <div className="absolute inset-0">
             <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
             {olympicsConfetti.map(c => (
                <div 
                    key={c.id}
                    className="absolute -top-4 rounded-sm animate-fall"
                    style={{
                        left: c.left,
                        width: c.size,
                        height: c.size,
                        backgroundColor: c.bg,
                        animationDuration: c.animationDuration,
                        animationDelay: c.animationDelay
                    }}
                />
            ))}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Medal size={400} className="text-white" />
            </div>
        </div>
      )}

      {/* 7. BIRTHDAY */}
      {effect === 'BIRTHDAY' && (
        <div className="absolute inset-0">
            {balloons.map(b => (
                <div 
                    key={b.id}
                    className="absolute -bottom-20 animate-float text-4xl"
                    style={{
                        left: b.left,
                        animationDuration: b.animationDuration,
                        animationDelay: b.animationDelay,
                        fontSize: `${30 * b.scale}px`
                    }}
                >
                    {b.emoji}
                </div>
            ))}
        </div>
      )}

      {/* 8. BONUS */}
      {effect === 'BONUS' && (
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay animate-pulse" />
            {moneyRain.map(m => (
                <div 
                    key={m.id}
                    className="absolute -top-10 animate-fall"
                    style={{
                        left: m.left,
                        fontSize: m.size,
                        animationDuration: m.animationDuration,
                        animationDelay: m.animationDelay
                    }}
                >
                    {m.emoji}
                </div>
            ))}
        </div>
      )}

      {/* 9. GOAL MET */}
      {effect === 'GOAL' && (
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay" />
            {goalItems.map(g => (
                <div 
                    key={g.id}
                    className="absolute -top-4 animate-fall"
                    style={{
                        left: g.left,
                        width: g.size,
                        height: g.size,
                        backgroundColor: g.type === 'STAR' ? g.color : 'transparent',
                        borderRadius: g.type === 'STAR' ? '50%' : '0',
                        animationDuration: g.animationDuration,
                        animationDelay: g.animationDelay,
                        boxShadow: g.type === 'STAR' ? '0 0 10px #fbbf24' : 'none'
                    }}
                >
                     {g.type === 'TROPHY' && <Trophy size={20} className="text-yellow-400" />}
                </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-full h-full bg-gradient-to-t from-yellow-500/20 to-transparent animate-pulse" />
            </div>
        </div>
      )}

      {/* 10. CUSTOM IMAGE */}
      {effect === 'CUSTOM' && layout.customPartyImage && (
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-purple-500/5 mix-blend-overlay" />
            {customItems.map(c => (
                <img 
                    key={c.id}
                    src={layout.customPartyImage}
                    className="absolute -top-20 animate-fall object-contain opacity-80"
                    style={{
                        left: c.left,
                        width: c.size,
                        height: c.size,
                        animationDuration: c.animationDuration,
                        animationDelay: c.animationDelay
                    }}
                />
            ))}
        </div>
      )}

    </div>
  );
};

export default React.memo(PartyOverlay);